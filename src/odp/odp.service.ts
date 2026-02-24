import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOdpDto } from './dto/create-odp.dto';
import { UpdateOdpDto } from './dto/update-odp.dto';

@Injectable()
export class OdpService {
    constructor(private prisma: PrismaService) { }

    async create(createOdpDto: CreateOdpDto) {
        return this.prisma.oDP.create({
            data: createOdpDto,
        });
    }

    async findAll(user?: any) {
        const where: any = {};

        if (user && user.role !== 'SUPERADMIN') {
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

                // 2. Filter by Specific Areas
                if (userWithPermissions.areas && userWithPermissions.areas.length > 0) {
                    where.areaId = { in: userWithPermissions.areas.map(a => a.id) };
                }
            }
        }

        return this.prisma.oDP.findMany({
            where,
            include: {
                area: true,
            },
        });
    }

    async findOne(id: number) {
        return this.prisma.oDP.findUnique({
            where: { id },
            include: {
                area: true,
            },
        });
    }

    async update(id: number, updateOdpDto: UpdateOdpDto) {
        return this.prisma.oDP.update({
            where: { id },
            data: updateOdpDto,
        });
    }

    async remove(id: number) {
        return this.prisma.oDP.delete({
            where: { id },
        });
    }
}
