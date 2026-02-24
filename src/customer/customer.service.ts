import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { RouterService } from '../router/router.service';

@Injectable()
export class CustomerService {
    constructor(
        private prisma: PrismaService,
        private routerService: RouterService
    ) { }

    async create(createCustomerDto: CreateCustomerDto) {
        let finalIdPelanggan = createCustomerDto.idPelanggan;

        if (!finalIdPelanggan) {
            // Generate unique ID
            let isUnique = false;
            while (!isUnique) {
                // YYMMDD
                const now = new Date();
                const year = now.getFullYear().toString().slice(-2);
                const month = (now.getMonth() + 1).toString().padStart(2, '0');
                const date = now.getDate().toString().padStart(2, '0');
                const prefix = `${year}${month}${date}`;

                // 4 random digits
                const random = Math.floor(1000 + Math.random() * 9000).toString();
                const candidateId = `${prefix}${random}`;

                // Check Uniqueness
                const count = await this.prisma.customer.count({
                    where: { idPelanggan: candidateId }
                });

                if (count === 0) {
                    finalIdPelanggan = candidateId;
                    isUnique = true;
                }
            }
        } else {
            // Check if provided ID exists
            const existing = await this.prisma.customer.findUnique({
                where: { idPelanggan: finalIdPelanggan }
            });
            if (existing) {
                throw new Error(`ID Pelanggan ${finalIdPelanggan} is already taken.`);
            }
        }

        const { tanggalAktif, tanggalAkhir, tanggalToleransi, idPelanggan, odpId, odpPortId, statusPelanggan, diskon, addonIds, useTax, taxId, latitude, longitude, ...rest } = createCustomerDto;

        // Build the data object
        const data = {
            namaPelanggan: rest.namaPelanggan,
            alamatPelanggan: rest.alamatPelanggan,
            teleponPelanggan: rest.teleponPelanggan,
            identitasPelanggan: rest.identitasPelanggan,
            latitude: latitude,
            longitude: longitude,
            area: { connect: { id: rest.areaId } },
            idPelanggan: finalIdPelanggan!,
            tanggalAktif: tanggalAktif ? new Date(tanggalAktif) : null,
            tanggalAkhir: tanggalAkhir ? new Date(tanggalAkhir) : null,
            tanggalToleransi: tanggalToleransi ? new Date(tanggalToleransi) : (tanggalAkhir ? new Date(tanggalAkhir) : null),
            odpPortId: (odpPortId ?? null) as any,
            statusPelanggan: statusPelanggan ?? 'ACTIVE',
            diskon: diskon ?? 0,
            useTax: useTax ?? false,
            ...(taxId ? { tax: { connect: { id: taxId } } } : {}),
            ...(odpId ? { odp: { connect: { id: odpId } } } : {}),
            activeAddons: addonIds && addonIds.length > 0 ? {
                create: addonIds.map(addonId => ({
                    addon: { connect: { id: addonId } }
                }))
            } : undefined,
        };

        return this.prisma.customer.create({ data: data as any });
    }

    async findAll(user?: any) {
        const where: any = {};

        if (user && user.role !== 'SUPERADMIN') {
            // Fetch fresh permissions (areas) for the user as they might not be in the session payload
            const userWithPermissions = await this.prisma.user.findUnique({
                where: { id: user.id },
                include: { areas: true }
            });

            if (userWithPermissions) {
                // 1. Filter by Branch
                if (userWithPermissions.branchId) {
                    where.area = {
                        branchId: userWithPermissions.branchId,
                    };
                }

                // 2. Filter by Specific Areas (if assigned)
                // If user has specific areas assigned, they should ONLY see customers in those areas
                // strictly intersecting with the branch if both are present (though usually area implies branch)
                if (userWithPermissions.areas && userWithPermissions.areas.length > 0) {
                    const areaIds = userWithPermissions.areas.map(a => a.id);
                    where.areaId = { in: areaIds };
                }
            }
        }

        return this.prisma.customer.findMany({
            where,
            include: {
                area: true,
                odp: true,
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });
    }

    async findOne(id: number) {
        const customer = await this.prisma.customer.findUnique({
            where: { id },
            include: {
                area: true,
                odp: true,
                connections: {
                    include: {
                        paket: true
                    }
                }
            },
        });
        if (!customer) throw new NotFoundException(`Customer with ID ${id} not found`);
        return customer;
    }

    async update(id: number, updateData: Partial<CreateCustomerDto>) {
        const customer = await this.findOne(id);

        const { tanggalAktif, tanggalAkhir, tanggalToleransi, addonIds, areaId, odpId, odpPortId, taxId, ...rest } = updateData;

        // Prepare data object
        const data: any = {
            ...rest,
            odpPortId: odpPortId,
        };

        // Dates
        if (tanggalAktif) data.tanggalAktif = new Date(tanggalAktif);
        if (tanggalAkhir) {
            const newDate = new Date(tanggalAkhir);
            data.tanggalAkhir = newDate;

            // Sync with UNPAID invoices
            await this.prisma.invoice.updateMany({
                where: {
                    customerId: id,
                    status: 'UNPAID'
                },
                data: {
                    tanggalJatuhTempo: newDate
                }
            });
        }

        let hasNewGraceDate = false;
        if (tanggalToleransi) {
            const newGrace = new Date(tanggalToleransi);
            data.tanggalToleransi = newGrace;
            // Check if this is a future grace date and customer is currently isolated
            if (newGrace > new Date() && customer.statusPelanggan === 'ISOLIR') {
                hasNewGraceDate = true;
                data.statusPelanggan = 'AKTIF'; // Auto-reactivate
            }
        }

        // Tax relation
        if (taxId) {
            data.tax = { connect: { id: taxId } };
        } else if (taxId === null) {
            data.tax = { disconnect: true };
        }

        // Relations
        if (areaId) {
            data.area = { connect: { id: areaId } };
        }

        if (odpId) {
            data.odp = { connect: { id: odpId } };
        } else if (odpId === null) {
            data.odp = { disconnect: true };
        }

        // Addons - Replace strategy
        if (addonIds) {
            data.activeAddons = {
                deleteMany: {},
                create: addonIds.map((aid: number) => ({ addon: { connect: { id: aid } } }))
            };
        }

        const updatedCustomer = await this.prisma.customer.update({
            where: { id },
            data,
        });

        // Trigger MikroTik Sync if grace date reactivation occurred
        if (hasNewGraceDate) {
            this.syncMikrotikAfterGrace(customer).catch(err => {
                console.error(`[GRACE-SYNC-ERROR] ${customer.namaPelanggan}:`, err.message);
            });
        }

        return updatedCustomer;
    }

    private async syncMikrotikAfterGrace(customer: any) {
        console.log(`[GRACE-ACTION] Membuka isolir otomatis untuk ${customer.namaPelanggan} karena Janji Bayar.`);

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
                console.log(`[GRACE-ACTION] PPP ${conn.pppUsername} berhasil dibuka.`);
            } catch (err) {
                console.error(`[GRACE-ACTION-ERR] ${conn.pppUsername}:`, err.message);
            }
        }
    }

    async remove(id: number) {
        await this.findOne(id);

        return this.prisma.$transaction(async (prisma) => {
            // Delete related Connections
            await prisma.connection.deleteMany({ where: { pelangganId: id } });

            // Delete related Addons
            await prisma.customerAddon.deleteMany({ where: { customerId: id } });

            // Delete Customer
            return prisma.customer.delete({ where: { id } });
        });
    }
}
