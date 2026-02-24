import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';

@Injectable()
export class AreaService {
    constructor(private prisma: PrismaService) { }

    async create(createAreaDto: CreateAreaDto) {
        return this.prisma.area.create({
            data: createAreaDto,
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
                    where.branchId = userWithPermissions.branchId;
                }

                // 2. Filter by Specific Areas
                if (userWithPermissions.areas && userWithPermissions.areas.length > 0) {
                    where.id = { in: userWithPermissions.areas.map(a => a.id) };
                }
            }
        }

        return this.prisma.area.findMany({
            where,
            include: {
                branch: true,
                odps: true,
            },
        });
    }

    async findOne(id: number) {
        return this.prisma.area.findUnique({
            where: { id },
            include: {
                branch: true,
                odps: true,
            },
        });
    }

    async update(id: number, updateAreaDto: UpdateAreaDto) {
        return this.prisma.area.update({
            where: { id },
            data: updateAreaDto,
        });
    }

    async remove(id: number) {
        return this.prisma.area.delete({
            where: { id },
        });
    }
}
