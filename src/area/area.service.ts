import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAreaDto } from './dto/create-area.dto';

@Injectable()
export class AreaService {
    constructor(private prisma: PrismaService) { }

    async create(createAreaDto: CreateAreaDto) {
        return this.prisma.area.create({
            data: createAreaDto,
        });
    }

    async findAll() {
        return this.prisma.area.findMany({
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

    async remove(id: number) {
        return this.prisma.area.delete({
            where: { id },
        });
    }
}
