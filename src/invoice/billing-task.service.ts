import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceService } from './invoice.service';
import { RouterService } from '../router/router.service';

@Injectable()
export class BillingTaskService {
    private readonly logger = new Logger(BillingTaskService.name);

    constructor(
        private prisma: PrismaService,
        private invoiceService: InvoiceService,
        private routerService: RouterService,
    ) { }

    @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
    async handleAutoBilling() {
        this.logger.log('Starting Auto Billing Generation...');
        const activeCustomers = await this.prisma.customer.findMany({
            where: { statusPelanggan: 'AKTIF' },
        });

        for (const customer of activeCustomers) {
            try {
                await this.invoiceService.generateNextMonth(customer.id);
            } catch (error) {
                this.logger.warn(`Skipping customer ${customer.namaPelanggan}: ${error.message}`);
            }
        }
    }

    @Cron('1 0 * * *')
    async handleAutoIsolation() {
        this.logger.log('CRON: Memulai proses isolir otomatis harian...');
        await this.runIsolationProcess();
    }

    /**
     * Inti dari proses isolir, bisa dipanggil via Cron atau Manual
     */
    async runIsolationProcess() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        console.log(`\n=== PROSES ISOLIR MANUAL DIMULAI ===`);
        console.log(`Waktu Eksekusi: ${new Date().toLocaleString()}`);
        console.log(`Pengecekan Tagihan s/d Tanggal: ${today.toLocaleDateString()}`);

        const unpaidInvoices = await this.prisma.invoice.findMany({
            where: {
                status: 'UNPAID',
                tanggalJatuhTempo: { lte: today },
            },
            include: {
                customer: {
                    include: { connections: true }
                }
            }
        });

        console.log(`[DATA] Ditemukan ${unpaidInvoices.length} tagihan UNPAID yang sudah jatuh tempo.`);
        unpaidInvoices.forEach(inv => {
            console.log(`  > TARGET: Invoice ${inv.invoiceNumber} | Customer: ${inv.customer?.namaPelanggan} (ID: ${inv.customer?.id})`);
            inv.customer?.connections?.forEach(c => {
                console.log(`    - Conn: ${c.pppUsername} (ID: ${c.id})`);
            });
        });

        let count = 0;
        let skippedCount = 0;

        for (const invoice of unpaidInvoices) {
            const { customer, tanggalJatuhTempo, hariToleransi, invoiceNumber } = invoice;

            if (!customer) {
                console.warn(`[WARN] Tagihan ${invoiceNumber} tidak memiliki data pelanggan. Skip.`);
                continue;
            }

            // 1. Cek Paksa Isolir (autoIsolate)
            if (!customer.autoIsolate) {
                console.log(`[SKIP] ${customer.namaPelanggan}: Fitur Auto-Isolate OFF.`);
                skippedCount++;
                continue;
            }

            // 2. Cek apakah sudah terisolir
            if (customer.statusPelanggan === 'ISOLIR') {
                console.log(`[SKIP] ${customer.namaPelanggan}: Status sudah ISOLIR.`);
                skippedCount++;
                continue;
            }

            // 3. Hitung Deadline (Jatuh Tempo + Toleransi)
            const deadline = new Date(tanggalJatuhTempo);
            deadline.setDate(deadline.getDate() + hariToleransi);
            deadline.setHours(0, 0, 0, 0);

            // 4. Cek Janji Bayar (Tanggal Toleransi Manual)
            if (customer.tanggalToleransi) {
                const graceDate = new Date(customer.tanggalToleransi);
                // Normalize both dates to midnight to avoid time‑zone issues
                graceDate.setHours(0, 0, 0, 0);
                const todayMid = new Date(today);
                todayMid.setHours(0, 0, 0, 0);
                if (todayMid.getTime() <= graceDate.getTime()) {
                    console.log(`[GRACE] ${customer.namaPelanggan}: Ada janji bayar s/d ${graceDate.toLocaleDateString()}. Skip.`);
                    skippedCount++;
                    continue;
                }
            }

            // 5. Eksekusi Isolir jika sudah lewat deadline
            if (today > deadline) {
                console.log(`[LOGOC] MENGISOLIR ${customer.namaPelanggan}:`);
                console.log(`  - No Tagihan: ${invoiceNumber}`);
                console.log(`  - Jatuh Tempo: ${tanggalJatuhTempo.toLocaleDateString()}`);
                console.log(`  - Toleransi: ${hariToleransi} hari (Batas: ${deadline.toLocaleDateString()})`);

                // Update DB
                await this.prisma.customer.update({
                    where: { id: customer.id },
                    data: { statusPelanggan: 'ISOLIR' }
                });

                // MikroTik (Background -> Serial Wait untuk mencegah Router Overload)
                try {
                    await this.applyIsolationToMikrotik(customer.connections, customer.namaPelanggan);
                } catch (e) {
                    console.error(`[ERR-MT] Gagal isolir MikroTik ${customer.namaPelanggan}: ${e.message}`);
                }

                count++;
            } else {
                console.log(`[WAIT] ${customer.namaPelanggan}: Masih dalam masa toleransi s/d ${deadline.toLocaleDateString()}.`);
            }
        }

        console.log(`\n=== RINGKASAN ISOLIR ===`);
        console.log(`Total Diproses: ${unpaidInvoices.length}`);
        console.log(`Berhasil Diisolir: ${count}`);
        console.log(`Dilewati (Skip/Grace): ${skippedCount}`);
        console.log(`=== SELESAI ===\n`);

        return {
            message: `Proses isolir selesai. ${count} pelanggan diisolir, ${skippedCount} dilewati.`,
            count
        };
    }

    private async applyIsolationToMikrotik(connections: any[], customerName: string) {
        for (const conn of connections) {
            // Skip if no pppUsername (NONE mode)
            if (!conn.pppUsername) {
                console.log(`[MT-SKIP] Connection tanpa secret PPP untuk ${customerName}`);
                continue;
            }

            try {
                const packageInfo = await this.prisma.package.findUnique({ where: { id: conn.paketId } });
                if (!packageInfo) continue;

                const router = await this.routerService.findOne(packageInfo.routerId);

                if (!router.isolir) {
                    console.log(`[MT-SKIP] Router ${router.namaRouter} mematikan fitur isolir otomatis.`);
                    continue;
                }

                if (router.isolirScheme === 'DISABLE') {
                    console.log(`[MT-EXEC] DISABLING Secret "${conn.pppUsername}" for ${customerName}`);
                    await this.routerService.disablePppSecret(packageInfo.routerId, conn.pppUsername);
                } else {
                    const isolirProfile = router.isolirProfile || 'ISOLIR';
                    console.log(`[MT-EXEC] CHANGING PROFILE "${conn.pppUsername}" to "${isolirProfile}" for ${customerName}`);
                    await this.routerService.setPppSecretProfile(packageInfo.routerId, conn.pppUsername, isolirProfile);
                }
            } catch (err) {
                console.error(`[MT-ERR] PPP ${conn.pppUsername}: ${err.message}`);
            }
        }
    }
}
