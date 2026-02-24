import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConnectionChangeRequestDto, ApproveConnectionChangeRequestDto } from './dto/connection-change-request.dto';
import { ConnectionService } from '../connection/connection.service';

@Injectable()
export class ConnectionChangeRequestService {
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
                    const areaIds = userWithPermissions.areas.map(a => a.id);
                    where.customer = {
                        ...(where.customer || {}),
                        areaId: { in: areaIds }
                    };
                }
            }
        }

        return this.prisma.connectionChangeRequest.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }

    async findPending(user?: any) {
        const requests = await this.findAll(user);
        return requests.filter(r => r.status === 'PENDING');
    }

    async findOne(id: number) {
        const request = await this.prisma.connectionChangeRequest.findUnique({
            where: { id },
        });
        if (!request) throw new NotFoundException('Request not found');
        return request;
    }

    async create(dto: CreateConnectionChangeRequestDto) {
        return this.prisma.connectionChangeRequest.create({
            data: {
                connectionId: dto.connectionId,
                customerId: dto.customerId,
                currentPppUsername: dto.currentPppUsername,
                currentPppPassword: dto.currentPppPassword,
                currentPppService: dto.currentPppService,
                currentSecretMode: dto.currentSecretMode,
                currentPaketId: dto.currentPaketId,
                newPppUsername: dto.newPppUsername,
                newPppPassword: dto.newPppPassword,
                newPppService: dto.newPppService,
                newSecretMode: dto.newSecretMode,
                newPaketId: dto.newPaketId,
                requestNote: dto.requestNote,
                requestedBy: dto.requestedBy,
                status: 'PENDING',
            },
        });
    }

    async approve(id: number, dto: ApproveConnectionChangeRequestDto) {
        const request = await this.findOne(id);

        if (request.status !== 'PENDING') {
            throw new Error('Request already processed');
        }

        // Apply changes to connection
        await this.connectionService.update(request.connectionId, {
            pppUsername: request.newPppUsername ?? undefined,
            pppPassword: request.newPppPassword ?? undefined,
            pppService: request.newPppService ?? undefined,
            secretMode: (request.newSecretMode as any) ?? undefined,
            paketId: request.newPaketId ?? undefined,
        });

        // Mark as approved
        return this.prisma.connectionChangeRequest.update({
            where: { id },
            data: {
                status: 'APPROVED',
                approvalNote: dto.approvalNote,
                approvedBy: dto.approvedBy,
                updatedAt: new Date(),
            },
        });
    }

    async reject(id: number, dto: ApproveConnectionChangeRequestDto) {
        const request = await this.findOne(id);

        if (request.status !== 'PENDING') {
            throw new Error('Request already processed');
        }

        return this.prisma.connectionChangeRequest.update({
            where: { id },
            data: {
                status: 'REJECTED',
                approvalNote: dto.approvalNote,
                approvedBy: dto.approvedBy,
                updatedAt: new Date(),
            },
        });
    }

    async delete(id: number) {
        await this.findOne(id);
        return this.prisma.connectionChangeRequest.delete({ where: { id } });
    }
}
