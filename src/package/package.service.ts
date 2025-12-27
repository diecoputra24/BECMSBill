import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';

@Injectable()
export class PackageService {
    constructor(private prisma: PrismaService) { }

    async create(createPackageDto: CreatePackageDto) {
        return this.prisma.package.create({
            data: createPackageDto,
        });
    }

    async findAll() {
        return this.prisma.package.findMany({
            include: {
                router: {
                    select: {
                        namaRouter: true,
                        hostAddress: true,
                    },
                },
            },
        });
    }

    async findOne(id: number) {
        const pkg = await this.prisma.package.findUnique({
            where: { id },
            include: {
                router: true,
            },
        });
        if (!pkg) throw new NotFoundException(`Package with ID ${id} not found`);
        return pkg;
    }

    async remove(id: number) {
        return this.prisma.package.delete({
            where: { id },
        });
    }

    async update(id: number, updateData: Partial<CreatePackageDto>) {
        await this.findOne(id);
        return this.prisma.package.update({
            where: { id },
            data: updateData,
        });
    }
}
