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

    async findAll() {
        return this.prisma.branch.findMany({
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
