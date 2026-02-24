import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoiceService {
  constructor(private prisma: PrismaService) { }

  async create(createInvoiceDto: CreateInvoiceDto) {
    const { customerId, period, items, category = 'RECURRING', type = 'PREPAID', tanggalJatuhTempo, hariToleransi = 0 } = createInvoiceDto;

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

    // Generate Invoice Number
    const invoiceNumber = await this.generateInvoiceNumber();

    const periodDate = new Date(period);
    periodDate.setDate(1);
    periodDate.setHours(0, 0, 0, 0);

    // Priority for Due Date:
    // 1. Explicitly provided tanggalJatuhTempo
    // 2. Customer's tanggalAkhir (Masa Aktif)
    // 3. Default to 25th of the period
    let dueDate = tanggalJatuhTempo ? new Date(tanggalJatuhTempo) : null;

    if (!dueDate) {
      const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
      if (customer && customer.tanggalAkhir) {
        dueDate = new Date(customer.tanggalAkhir);
      } else {
        dueDate = new Date(periodDate);
        dueDate.setDate(25);
      }
    }

    return this.prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId,
        period: periodDate,
        tanggalJatuhTempo: dueDate,
        hariToleransi,
        amount: totalAmount,
        category,
        type,
        status: 'UNPAID',
        items: {
          create: items.map(item => ({
            description: item.description,
            itemType: item.itemType,
            amount: item.amount,
          })),
        },
      },
      include: {
        items: true,
        customer: true,
      },
    });
  }

  async generateNextMonth(customerId: number) {
    // 1. Get latest invoice for this customer to determine the next period
    const lastInvoice = await this.prisma.invoice.findFirst({
      where: { customerId },
      orderBy: { period: 'desc' }
    });

    let nextPeriod = new Date();
    nextPeriod.setDate(1);
    nextPeriod.setHours(0, 0, 0, 0);

    if (lastInvoice) {
      nextPeriod = new Date(lastInvoice.period);
      nextPeriod.setMonth(nextPeriod.getMonth() + 1);
    }

    return this.createInvoiceForPeriod(customerId, nextPeriod);
  }

  private async getCustomerInvoiceData(customerId: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        connections: {
          include: {
            paket: true
          }
        },
        activeAddons: {
          include: {
            addon: true
          }
        },
        tax: true // Include tax relation
      }
    });

    if (!customer) throw new NotFoundException('Customer not found');

    const items: { description: string; itemType: string; amount: number }[] = [];
    let subtotal = 0;

    // Main Package
    const mainConnection = customer.connections[0];
    if (mainConnection) {
      items.push({
        description: mainConnection.paket.namaPaket,
        itemType: 'PACKAGE',
        amount: Number(mainConnection.paket.hargaPaket)
      });
      subtotal += Number(mainConnection.paket.hargaPaket);
    }

    // Addons
    for (const ca of customer.activeAddons) {
      items.push({
        description: ca.addon.name,
        itemType: 'ADDON',
        amount: Number(ca.addon.price)
      });
      subtotal += Number(ca.addon.price);
    }

    // Manual Discounts (on Customer record)
    if (Number(customer.diskon) > 0) {
      items.push({
        description: 'DISKON KHUSUS',
        itemType: 'DISCOUNT',
        amount: -Number(customer.diskon)
      });
      subtotal -= Number(customer.diskon);
    }

    // PPN Calculation
    let totalAmount = subtotal;
    if (customer.useTax && customer.tax) {
      const taxAmount = Math.round(subtotal * (customer.tax.value / 100));
      items.push({
        description: customer.tax.name,
        itemType: 'TAX',
        amount: taxAmount
      });
      totalAmount += taxAmount;
    }

    return { items, totalAmount, customer };
  }

  private async createInvoiceForPeriod(customerId: number, period: Date) {
    // 1. Check if an invoice for this period already exists
    const existing = await this.prisma.invoice.findFirst({
      where: {
        customerId,
        period: period,
        status: { not: 'VOID' }
      }
    });

    if (existing) {
      throw new Error(`Invoice for period ${period.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })} already exists.`);
    }

    // Get latest customer data
    const { items, totalAmount, customer } = await this.getCustomerInvoiceData(customerId);

    // 3. Create Invoice
    const invoiceNumber = await this.generateInvoiceNumber();

    // Due Date follows Customer's tanggalAkhir (Masa Aktif)
    let dueDate = customer.tanggalAkhir ? new Date(customer.tanggalAkhir) : new Date(period);
    if (!customer.tanggalAkhir) {
      dueDate.setDate(25);
    }

    return this.prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId,
        period: period,
        tanggalJatuhTempo: dueDate,
        hariToleransi: 0,
        amount: totalAmount,
        status: 'UNPAID',
        items: {
          create: items.map(i => ({
            description: i.description,
            itemType: i.itemType,
            amount: i.amount
          }))
        }
      },
      include: {
        items: true,
        customer: true
      }
    });
  }

  async recalculate(id: number) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status !== 'UNPAID') {
      throw new Error('Only UNPAID invoices can be recalculated.');
    }

    const { items, totalAmount } = await this.getCustomerInvoiceData(invoice.customerId);

    return this.prisma.$transaction(async (tx) => {
      // 1. Delete old items
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id }
      });

      // 2. Update invoice with new items and amount
      return tx.invoice.update({
        where: { id },
        data: {
          amount: totalAmount,
          items: {
            create: items.map(i => ({
              description: i.description,
              itemType: i.itemType,
              amount: i.amount
            }))
          }
        },
        include: {
          items: true,
          customer: true
        }
      });
    });
  }

  async getBatchGenerateInfo(user?: any) {
    const customerWhere: any = { statusPelanggan: 'AKTIF' };

    if (user && user.role !== 'SUPERADMIN') {
      const userWithPermissions = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: { areas: true }
      });

      if (userWithPermissions) {
        if (userWithPermissions.branchId) {
          customerWhere.area = { branchId: userWithPermissions.branchId };
        }
        if (userWithPermissions.areas && userWithPermissions.areas.length > 0) {
          customerWhere.areaId = { in: userWithPermissions.areas.map(a => a.id) };
        }
      }
    }

    const activeCustomers = await this.prisma.customer.findMany({
      where: customerWhere
    });

    const targetDate = new Date();
    targetDate.setDate(1);
    targetDate.setHours(0, 0, 0, 0);

    let countNeeded = 0;
    for (const customer of activeCustomers) {
      const existing = await this.prisma.invoice.findFirst({
        where: {
          customerId: customer.id,
          period: targetDate,
          status: { not: 'VOID' }
        }
      });
      if (!existing) countNeeded++;
    }

    return {
      targetMonth: targetDate,
      totalActiveCustomers: activeCustomers.length,
      customersToGenerate: countNeeded
    };
  }

  async generateBatch(user?: any) {
    const customerWhere: any = { statusPelanggan: 'AKTIF' };

    if (user && user.role !== 'SUPERADMIN') {
      const userWithPermissions = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: { areas: true }
      });

      if (userWithPermissions) {
        if (userWithPermissions.branchId) {
          customerWhere.area = { branchId: userWithPermissions.branchId };
        }
        if (userWithPermissions.areas && userWithPermissions.areas.length > 0) {
          customerWhere.areaId = { in: userWithPermissions.areas.map(a => a.id) };
        }
      }
    }

    const activeCustomers = await this.prisma.customer.findMany({
      where: customerWhere
    });

    const targetDate = new Date();
    targetDate.setDate(1);
    targetDate.setHours(0, 0, 0, 0);

    let generated = 0;
    let skipped = 0;
    const errors: { customerName: string; error: string }[] = [];

    for (const customer of activeCustomers) {
      try {
        // Check duplication logic: Only generate if targetDate doesn't exist
        const existing = await this.prisma.invoice.findFirst({
          where: {
            customerId: customer.id,
            period: targetDate,
            status: { not: 'VOID' }
          }
        });

        if (existing) {
          skipped++;
          continue;
        }

        await this.createInvoiceForPeriod(customer.id, targetDate);
        generated++;
      } catch (error) {
        errors.push({ customerName: customer.namaPelanggan, error: error.message });
      }
    }

    return {
      totalProcessed: activeCustomers.length,
      generated,
      skipped,
      errors
    };
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

    return this.prisma.invoice.findMany({
      where,
      include: {
        customer: {
          include: {
            area: true,
          }
        },
        items: true,
        transaction: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
        transaction: true,
      },
    });
    if (!invoice) throw new NotFoundException(`Invoice with ID ${id} not found`);
    return invoice;
  }

  async update(id: number, updateInvoiceDto: UpdateInvoiceDto) {
    const { items, ...updateData } = updateInvoiceDto;

    return this.prisma.invoice.update({
      where: { id },
      data: {
        ...updateData,
        ...(items && {
          items: {
            deleteMany: {},
            create: items.map(item => ({
              description: item.description,
              itemType: item.itemType,
              amount: item.amount,
            })),
          },
        }),
      },
      include: {
        items: true,
      },
    });
  }

  remove(id: number) {
    return this.prisma.invoice.delete({
      where: { id },
    });
  }

  private async generateInvoiceNumber(): Promise<string> {
    const random = Math.floor(100000 + Math.random() * 900000).toString();

    // Ensure uniqueness
    const exists = await this.prisma.invoice.findUnique({
      where: { invoiceNumber: random }
    });

    if (exists) {
      return this.generateInvoiceNumber();
    }

    return random;
  }
}

