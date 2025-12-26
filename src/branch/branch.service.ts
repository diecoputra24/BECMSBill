import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';

@Injectable()
export class BranchService {
    constructor(private prisma: PrismaService) { }

    async create(createBranchDto: CreateBranchDto) {
        return this.prisma.branch.create({
            data: createBranchDto,
        });
    }

    async findAll() {
        return this.prisma.branch.findMany();
    }

    async findOne(id: number) {
        return this.prisma.branch.findUnique({
            where: { id },
        });
    }

    async remove(id: number) {
        return this.prisma.branch.delete({
            where: { id },
        });
    }
}
