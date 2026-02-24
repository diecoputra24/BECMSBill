import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchService {
    constructor(private prisma: PrismaService) { }

    async create(createBranchDto: CreateBranchDto) {
        return this.prisma.branch.create({
            data: createBranchDto,
        });
    }

    async findAll(user?: any) {
        const where: any = {};

        if (user && user.role !== 'SUPERADMIN') {
            const userWithPermissions = await this.prisma.user.findUnique({
                where: { id: user.id },
                include: { areas: { include: { branch: true } } }
            });

            if (userWithPermissions) {
                const permittedBranchIds = new Set<number>();

                // Add primary branch
                if (userWithPermissions.branchId) {
                    permittedBranchIds.add(userWithPermissions.branchId);
                }

                // Add branches from specific area permissions
                if (userWithPermissions.areas) {
                    userWithPermissions.areas.forEach(a => permittedBranchIds.add(a.branchId));
                }

                if (permittedBranchIds.size > 0) {
                    where.id = { in: Array.from(permittedBranchIds) };
                }
            }
        }

        return this.prisma.branch.findMany({
            where,
            include: {
                areas: true,
            },
        });
    }


    async findOne(id: number) {
        return this.prisma.branch.findUnique({
            where: { id },
            include: {
                areas: true,
            },
        });
    }

    async update(id: number, updateBranchDto: UpdateBranchDto) {
        return this.prisma.branch.update({
            where: { id },
            data: updateBranchDto,
        });
    }

    async remove(id: number) {
        return this.prisma.branch.delete({
            where: { id },
        });
    }
}
