import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOdpDto } from './dto/create-odp.dto';

@Injectable()
export class OdpService {
    constructor(private prisma: PrismaService) { }

    async create(createOdpDto: CreateOdpDto) {
        return this.prisma.oDP.create({
            data: createOdpDto,
        });
    }

    async findAll() {
        return this.prisma.oDP.findMany({
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

    async remove(id: number) {
        return this.prisma.oDP.delete({
            where: { id },
        });
    }
}
