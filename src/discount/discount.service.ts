import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DiscountService {
    constructor(private prisma: PrismaService) { }

    findAll() {
        return this.prisma.discount.findMany();
    }

    findOne(id: number) {
        return this.prisma.discount.findUnique({ where: { id } });
    }
}
