import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RouterService } from '../router/router.service';

@Injectable()
export class TransactionService {
  constructor(
    private prisma: PrismaService,
    private routerService: RouterService
  ) { }

  async create(createTransactionDto: CreateTransactionDto) {
    const { invoiceIds, adminId, amountPaid, paymentMethod = 'CASH', customerId, proofImage } = createTransactionDto;

    console.log(`\n=== TRANSAKSI BARU DIMULAI ===`);
    console.log(`Target Customer ID: ${customerId}`);

    const referenceNo = await this.generateReferenceNo();

    // 1. Eksekusi Database (WAJIB CEPAT)
    const transaction = await this.prisma.$transaction(async (tx: any) => {
      const res = await tx.transaction.create({
        data: {
          referenceNo,
          amountPaid,
          paymentMethod,
          proofImage,
          adminId,
          customerId,
          invoices: { connect: invoiceIds.map(id => ({ id })) },
        },
      });

      await tx.invoice.updateMany({
        where: { id: { in: invoiceIds } },
        data: { status: 'PAID' },
      });

      // Update related PromiseToPay status to PAID
      await tx.promiseToPay.updateMany({
        where: {
          invoiceId: { in: invoiceIds },
          status: 'WAITING'
        },
        data: { status: 'PAID' }
      });

      if (customerId && invoiceIds.length > 0) {
        const cId = Number(customerId);
        const customer = await tx.customer.findUnique({ where: { id: cId } });

        if (customer) {
          const latestInvoicePaid = await tx.invoice.findFirst({
            where: { id: { in: invoiceIds } },
            orderBy: { period: 'desc' }
          });

          if (latestInvoicePaid) {
            const invoicePeriodEnd = new Date(latestInvoicePaid.period);
            invoicePeriodEnd.setMonth(invoicePeriodEnd.getMonth() + 1);
            if (customer.tanggalAkhir) {
              invoicePeriodEnd.setDate(new Date(customer.tanggalAkhir).getDate());
            } else {
              invoicePeriodEnd.setDate(25);
            }
            invoicePeriodEnd.setHours(23, 59, 59, 999);

            let nextExpiry = (customer.tanggalAkhir && new Date(customer.tanggalAkhir) >= invoicePeriodEnd)
              ? new Date(customer.tanggalAkhir)
              : invoicePeriodEnd;

            await tx.customer.update({
              where: { id: cId },
              data: {
                tanggalAkhir: nextExpiry,
                statusPelanggan: 'AKTIF',
                tanggalToleransi: null
              }
            });
          }
        }
      }
      return res;
    });

    // 2. Eksekusi MikroTik (DI LUAR TRANSAKSI DB - AGAR TIDAK LOCK DB)
    // Jalankan secara asinkron (Fire and Forget) agar response ke user tidak menunggu MikroTik
    this.syncMikrotikAfterPayment(customerId).catch(err => {
      console.error(`[BACKGROUND SYNC ERROR]`, err.message);
    });

    console.log(`=== DATABASE SELESAI ===\n`);
    return transaction;
  }

  /**
   * Fungsi untuk sinkronisasi MikroTik tanpa mengganggu kecepatan Database
   */
  private async syncMikrotikAfterPayment(customerId: any) {
    if (!customerId) return;

    // Ambil data koneksi secara mandiri
    const connections = await this.prisma.connection.findMany({
      where: { pelangganId: Number(customerId) },
      include: {
        paket: true
      }
    });

    for (const conn of connections) {
      // Skip if no pppUsername (NONE mode) or no mikrotik profile
      if (conn.paket && conn.paket.mikrotikProfile && conn.pppUsername) {
        try {
          console.log(`[ASYNC SYNC] Memperbarui router untuk user: ${conn.pppUsername}`);
          await this.routerService.setPppSecretProfile(
            conn.paket.routerId,
            conn.pppUsername,
            conn.paket.mikrotikProfile
          );
        } catch (err) {
          console.error(`[ASYNC SYNC FAILED] ${conn.pppUsername}: ${err.message}`);
        }
      }
    }
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

    return this.prisma.transaction.findMany({
      where,
      include: {
        admin: true,
        customer: true,
        invoices: {
          include: {
            items: true
          }
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        admin: true,
        customer: true,
        invoices: {
          include: {
            items: true
          }
        },
      },
    });
    if (!transaction) throw new NotFoundException(`Transaction with ID ${id} not found`);
    return transaction;
  }

  async update(id: number, updateTransactionDto: UpdateTransactionDto) {
    const { invoiceIds, ...updateData } = updateTransactionDto;

    return this.prisma.transaction.update({
      where: { id },
      data: {
        ...updateData,
        ...(invoiceIds && {
          invoices: {
            set: invoiceIds.map(id => ({ id })),
          },
        }),
      },
    });
  }

  remove(id: number) {
    return this.prisma.transaction.delete({
      where: { id },
    });
  }

  async removeMany(ids: number[]) {
    return this.prisma.transaction.deleteMany({
      where: {
        id: { in: ids }
      }
    });
  }

  private async generateReferenceNo(): Promise<string> {
    const date = new Date();
    const year = String(date.getFullYear()).slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const prefix = `TX-${year}${month}-`;

    // Generate a unique random alphanumeric string of length 5
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars like I, O, 0, 1
    let randomPart = '';

    // Attempt to generate a unique one (looping a few times if necessary)
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      randomPart = '';
      for (let i = 0; i < 5; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const exists = await this.prisma.transaction.findFirst({
        where: { referenceNo: `${prefix}${randomPart}` }
      });

      if (!exists) isUnique = true;
      attempts++;
    }

    return `${prefix}${randomPart}`;
  }
}
