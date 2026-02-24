import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerChangeRequestDto, ApproveCustomerChangeRequestDto } from './dto/customer-change-request.dto';

@Injectable()
export class CustomerChangeRequestService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.customerChangeRequest.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async findPending() {
        return this.prisma.customerChangeRequest.findMany({
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: number) {
        const request = await this.prisma.customerChangeRequest.findUnique({
            where: { id },
        });
        if (!request) throw new NotFoundException('Customer change request not found');
        return request;
    }

    async create(dto: CreateCustomerChangeRequestDto) {
        return this.prisma.customerChangeRequest.create({
            data: {
                customerId: dto.customerId,
                // Current values
                currentNama: dto.currentNama,
                currentAlamat: dto.currentAlamat,
                currentTelepon: dto.currentTelepon,
                currentIdentitas: dto.currentIdentitas,
                currentAreaId: dto.currentAreaId,
                currentOdpId: dto.currentOdpId,
                currentOdpPortId: dto.currentOdpPortId,
                currentLatitude: dto.currentLatitude,
                currentLongitude: dto.currentLongitude,
                // New values
                newNama: dto.newNama,
                newAlamat: dto.newAlamat,
                newTelepon: dto.newTelepon,
                newIdentitas: dto.newIdentitas,
                newAreaId: dto.newAreaId,
                newOdpId: dto.newOdpId,
                newOdpPortId: dto.newOdpPortId,
                newLatitude: dto.newLatitude,
                newLongitude: dto.newLongitude,
                // Workflow
                requestNote: dto.requestNote,
                requestedBy: dto.requestedBy,
                status: 'PENDING',
            },
        });
    }

    async approve(id: number, dto: ApproveCustomerChangeRequestDto) {
        const request = await this.findOne(id);

        if (request.status !== 'PENDING') {
            throw new Error('Request already processed');
        }

        // Update the customer with new values
        await this.prisma.customer.update({
            where: { id: request.customerId },
            data: {
                namaPelanggan: request.newNama,
                alamatPelanggan: request.newAlamat,
                teleponPelanggan: request.newTelepon,
                identitasPelanggan: request.newIdentitas,
                areaId: request.newAreaId,
                odpId: request.newOdpId,
                odpPortId: request.newOdpPortId,
                latitude: request.newLatitude,
                longitude: request.newLongitude,
            },
        });

        // Mark request as approved
        return this.prisma.customerChangeRequest.update({
            where: { id },
            data: {
                status: 'APPROVED',
                approvalNote: dto.approvalNote,
                approvedBy: dto.approvedBy,
            },
        });
    }

    async reject(id: number, dto: ApproveCustomerChangeRequestDto) {
        const request = await this.findOne(id);

        if (request.status !== 'PENDING') {
            throw new Error('Request already processed');
        }

        return this.prisma.customerChangeRequest.update({
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
        return this.prisma.customerChangeRequest.delete({ where: { id } });
    }
}
