import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddonDto } from './dto/create-addon.dto';
import { UpdateAddonDto } from './dto/update-addon.dto';

@Injectable()
export class AddonService {
    constructor(private prisma: PrismaService) { }

    async create(createAddonDto: CreateAddonDto) {
        return this.prisma.addon.create({
            data: createAddonDto,
        });
    }

    async findAll() {
        return this.prisma.addon.findMany();
    }

    async findOne(id: number) {
        const addon = await this.prisma.addon.findUnique({
            where: { id },
        });
        if (!addon) throw new NotFoundException(`Addon with ID ${id} not found`);
        return addon;
    }

    async update(id: number, updateAddonDto: UpdateAddonDto) {
        await this.findOne(id);
        return this.prisma.addon.update({
            where: { id },
            data: updateAddonDto,
        });
    }

    async remove(id: number) {
        await this.findOne(id);
        return this.prisma.addon.delete({
            where: { id },
        });
    }
}
