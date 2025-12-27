import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomerService {
    constructor(private prisma: PrismaService) { }

    async create(createCustomerDto: CreateCustomerDto) {
        return this.prisma.customer.create({
            data: {
                ...createCustomerDto,
                tanggalAktif: createCustomerDto.tanggalAktif ? new Date(createCustomerDto.tanggalAktif) : null,
                tanggalAkhir: createCustomerDto.tanggalAkhir ? new Date(createCustomerDto.tanggalAkhir) : null,
                tanggalToleransi: createCustomerDto.tanggalToleransi ? new Date(createCustomerDto.tanggalToleransi) : null,
            },
        });
    }

    async findAll() {
        return this.prisma.customer.findMany({
            include: {
                area: true,
                odp: true,
            },
        });
    }

    async findOne(id: number) {
        const customer = await this.prisma.customer.findUnique({
            where: { id },
            include: {
                area: true,
                odp: true,
            },
        });
        if (!customer) throw new NotFoundException(`Customer with ID ${id} not found`);
        return customer;
    }

    async update(id: number, updateData: Partial<CreateCustomerDto>) {
        await this.findOne(id);

        // Prepare data for update, handling dates if present
        const data: any = { ...updateData };
        if (updateData.tanggalAktif) data.tanggalAktif = new Date(updateData.tanggalAktif);
        if (updateData.tanggalAkhir) data.tanggalAkhir = new Date(updateData.tanggalAkhir);
        if (updateData.tanggalToleransi) data.tanggalToleransi = new Date(updateData.tanggalToleransi);

        return this.prisma.customer.update({
            where: { id },
            data,
        });
    }

    async remove(id: number) {
        await this.findOne(id);
        return this.prisma.customer.delete({
            where: { id },
        });
    }
}
