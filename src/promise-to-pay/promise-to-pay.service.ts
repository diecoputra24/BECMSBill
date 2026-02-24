import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromiseDto } from './dto/create-promise.dto';
import { RouterService } from '../router/router.service';

@Injectable()
export class PromiseToPayService {
    constructor(
        private prisma: PrismaService,
        private routerService: RouterService
    ) { }

    async create(dto: CreatePromiseDto) {
        const { customerId, invoiceId, promiseDate, note, adminId } = dto;

        // 1. Ambil data customer dan koneksinya
        const customer = await this.prisma.customer.findUnique({
            where: { id: customerId },
            include: {
                connections: {
                    include: { paket: true }
                }
            }
        });

        if (!customer) throw new NotFoundException('Customer not found');

        // 2. Buat record Janji Bayar
        const promise = await this.prisma.promiseToPay.create({
            data: {
                customerId,
                invoiceId,
                promiseDate: new Date(promiseDate),
                note,
                adminId,
                status: 'WAITING'
            }
        });

        // 3. Update Customer: Set Tanggal Toleransi & Aktifkan Kembali jika Isolir
        const updateData: any = {
            tanggalToleransi: new Date(promiseDate)
        };

        if (customer.statusPelanggan === 'ISOLIR') {
            updateData.statusPelanggan = 'AKTIF';
        }

        await this.prisma.customer.update({
            where: { id: customerId },
            data: updateData
        });

        // 4. Jika sebelumnya Isolir, buka di MikroTik
        if (customer.statusPelanggan === 'ISOLIR') {
            this.syncMikrotikAfterPromise(customer).catch(err => {
                console.error(`[PROMISE-SYNC-ERR] ${customer.namaPelanggan}:`, err.message);
            });
        }

        return promise;
    }

    async findAll(user?: any) {
        const where: any = {};

        if (user && user.role !== 'SUPERADMIN') {
            const userWithPermissions = await this.prisma.user.findUnique({
                where: { id: user.id },
                include: { areas: true }
            });

            if (userWithPermissions) {
                if (userWithPermissions.branchId) {
                    where.customer = {
                        area: { branchId: userWithPermissions.branchId }
                    };
                }
                if (userWithPermissions.areas && userWithPermissions.areas.length > 0) {
                    where.customer = {
                        ...(where.customer || {}),
                        areaId: { in: userWithPermissions.areas.map(a => a.id) }
                    };
                }
            }
        }

        return this.prisma.promiseToPay.findMany({
            where,
            include: {
                customer: {
                    include: { area: true }
                },
                invoice: true,
                admin: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findByCustomer(customerId: number) {
        return this.prisma.promiseToPay.findMany({
            where: { customerId },
            include: { invoice: true, admin: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async remove(id: number) {
        const promise = await this.prisma.promiseToPay.findUnique({
            where: { id },
            include: { customer: true }
        });

        if (!promise) throw new NotFoundException('Janji Bayar tidak ditemukan');

        return await this.prisma.$transaction(async (tx) => {
            // 1. Update Customer: Clear Tanggal Toleransi
            await tx.customer.update({
                where: { id: promise.customerId },
                data: { tanggalToleransi: null }
            });

            // 2. Delete the Promise record
            return tx.promiseToPay.delete({
                where: { id }
            });
        });
    }

    private async syncMikrotikAfterPromise(customer: any) {
        for (const conn of customer.connections) {
            // Skip if no pppUsername (NONE mode)
            if (!conn.pppUsername) continue;

            try {
                const packageInfo = conn.paket;
                if (!packageInfo) continue;

                const router = await this.prisma.router.findUnique({ where: { id: packageInfo.routerId } });
                if (!router) continue;

                if (router.isolirScheme === 'DISABLE') {
                    await this.routerService.enablePppSecret(router.id, conn.pppUsername);
                } else {
                    const profile = packageInfo.mikrotikProfile || 'default';
                    await this.routerService.setPppSecretProfile(router.id, conn.pppUsername, profile);
                }
            } catch (err) {
                console.error(`[PROMISE-MT-ERR] ${conn.pppUsername}:`, err.message);
            }
        }
    }
}
