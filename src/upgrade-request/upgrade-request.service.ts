import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUpgradeRequestDto, ApproveUpgradeRequestDto } from './dto/upgrade-request.dto';
import { ConnectionService } from '../connection/connection.service';

@Injectable()
export class UpgradeRequestService {
    constructor(
        private prisma: PrismaService,
        private connectionService: ConnectionService
    ) { }

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

        return this.prisma.upgradeRequest.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }

    async findPending(user?: any) {
        const where: any = { status: 'PENDING' };

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

        return this.prisma.upgradeRequest.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: number) {
        const request = await this.prisma.upgradeRequest.findUnique({
            where: { id },
        });
        if (!request) throw new NotFoundException('Upgrade request not found');
        return request;
    }

    async create(dto: CreateUpgradeRequestDto) {
        return this.prisma.upgradeRequest.create({
            data: {
                connectionId: dto.connectionId,
                customerId: dto.customerId,
                currentPaketId: dto.currentPaketId,
                newPaketId: dto.newPaketId,
                requestNote: dto.requestNote,
                requestedBy: dto.requestedBy,
                status: 'PENDING',
            },
        });
    }

    async approve(id: number, dto: ApproveUpgradeRequestDto) {
        const request = await this.findOne(id);

        if (request.status !== 'PENDING') {
            throw new Error('Request already processed');
        }

        // Update the connection with new package -> This will also sync MikroTik
        await this.connectionService.update(request.connectionId, {
            paketId: request.newPaketId,
        });

        // Mark request as approved
        return this.prisma.upgradeRequest.update({
            where: { id },
            data: {
                status: 'APPROVED',
                approvalNote: dto.approvalNote,
                approvedBy: dto.approvedBy,
            },
        });
    }

    async reject(id: number, dto: ApproveUpgradeRequestDto) {
        const request = await this.findOne(id);

        if (request.status !== 'PENDING') {
            throw new Error('Request already processed');
        }

        return this.prisma.upgradeRequest.update({
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
        return this.prisma.upgradeRequest.delete({ where: { id } });
    }
}
