import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RouterService } from '../router/router.service';
import { CreateCustomerStatusRequestDto, ApproveCustomerStatusRequestDto } from './dto/customer-status-request.dto';

@Injectable()
export class CustomerStatusRequestService {
    constructor(
        private prisma: PrismaService,
        private routerService: RouterService,
    ) { }

    async create(dto: CreateCustomerStatusRequestDto) {
        return this.prisma.customerStatusRequest.create({
            data: {
                customerId: dto.customerId,
                currentStatus: dto.currentStatus,
                newStatus: dto.newStatus,
                reason: dto.reason,
                requestNote: dto.requestNote,
                requestedBy: dto.requestedBy,
            },
        });
    }

    async findAll(pendingOnly = false) {
        return this.prisma.customerStatusRequest.findMany({
            where: pendingOnly ? { status: 'PENDING' } : undefined,
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: number) {
        const request = await this.prisma.customerStatusRequest.findUnique({
            where: { id },
        });
        if (!request) {
            throw new NotFoundException(`CustomerStatusRequest with ID ${id} not found`);
        }
        return request;
    }

    async approve(id: number, dto: ApproveCustomerStatusRequestDto) {
        const request = await this.findOne(id);

        // Get customer and connection info
        const customer = await this.prisma.customer.findUnique({
            where: { id: request.customerId },
            include: {
                connections: true
            }
        });

        if (!customer) {
            throw new NotFoundException(`Customer with ID ${request.customerId} not found`);
        }

        // Apply status change to customer
        await this.prisma.customer.update({
            where: { id: request.customerId },
            data: { statusPelanggan: request.newStatus },
        });

        // Handle MikroTik based on new status - using same approach as isolir
        for (const conn of customer.connections) {
            // Skip if no pppUsername (NONE mode)
            if (!conn.pppUsername) {
                console.log(`[CustomerStatusRequest] Connection tanpa secret PPP untuk ${customer.namaPelanggan}`);
                continue;
            }

            try {
                // Fetch package to get router ID (same as isolir approach)
                const packageInfo = await this.prisma.package.findUnique({ where: { id: conn.paketId } });
                if (!packageInfo) {
                    console.log(`[CustomerStatusRequest] Package not found for connection ${conn.id}`);
                    continue;
                }

                const router = await this.routerService.findOne(packageInfo.routerId);
                console.log(`[CustomerStatusRequest] Customer: ${customer.namaPelanggan}, PPP: ${conn.pppUsername}, Router: ${router.namaRouter}`);

                if (request.newStatus === 'NONAKTIF' || request.newStatus === 'BERHENTI') {
                    // Disable PPP secret on MikroTik - same as isolir DISABLE scheme
                    console.log(`[CustomerStatusRequest] DISABLING Secret "${conn.pppUsername}" for ${customer.namaPelanggan}`);
                    await this.routerService.disablePppSecret(packageInfo.routerId, conn.pppUsername);
                    console.log(`[CustomerStatusRequest] Successfully disabled PPP secret for ${conn.pppUsername}`);
                } else if (request.newStatus === 'AKTIF') {
                    // Re-enable PPP secret on MikroTik
                    console.log(`[CustomerStatusRequest] ENABLING Secret "${conn.pppUsername}" for ${customer.namaPelanggan}`);
                    await this.routerService.enablePppSecret(packageInfo.routerId, conn.pppUsername);
                    console.log(`[CustomerStatusRequest] Successfully enabled PPP secret for ${conn.pppUsername}`);
                }
            } catch (err) {
                console.error(`[CustomerStatusRequest] PPP ${conn.pppUsername}: ${err.message}`);
            }
        }

        // Update request status to approved
        return this.prisma.customerStatusRequest.update({
            where: { id },
            data: {
                status: 'APPROVED',
                approvalNote: dto.approvalNote,
                approvedBy: dto.approvedBy,
            },
        });
    }

    async reject(id: number, dto: ApproveCustomerStatusRequestDto) {
        await this.findOne(id);

        return this.prisma.customerStatusRequest.update({
            where: { id },
            data: {
                status: 'REJECTED',
                approvalNote: dto.approvalNote,
                approvedBy: dto.approvedBy,
            },
        });
    }

    async delete(id: number) {
        await this.findOne(id);
        return this.prisma.customerStatusRequest.delete({
            where: { id },
        });
    }
}
