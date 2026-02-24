import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';

@Injectable()
export class TaxService {
    constructor(private prisma: PrismaService) { }

    async create(createTaxDto: CreateTaxDto) {
        return this.prisma.tax.create({
            data: createTaxDto,
        });
    }

    async findAll() {
        return this.prisma.tax.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async findOne(id: number) {
        const tax = await this.prisma.tax.findUnique({
            where: { id },
        });
        if (!tax) throw new NotFoundException(`Tax with ID ${id} not found`);
        return tax;
    }

    async update(id: number, updateTaxDto: UpdateTaxDto) {
        await this.findOne(id);
        return this.prisma.tax.update({
            where: { id },
            data: updateTaxDto,
        });
    }

    async remove(id: number) {
        await this.findOne(id);
        return this.prisma.tax.delete({
            where: { id },
        });
    }
}
