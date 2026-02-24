import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNetworkMapDto } from './dto/create-network-map.dto';
import { UpdateNetworkMapDto } from './dto/update-network-map.dto';

@Injectable()
export class NetworkMapService {
    constructor(private prisma: PrismaService) { }

    create(createNetworkMapDto: CreateNetworkMapDto) {
        return this.prisma.networkMap.create({
            data: createNetworkMapDto,
        });
    }

    findAll() {
        return this.prisma.networkMap.findMany({
            orderBy: { updatedAt: 'desc' },
        });
    }

    findOne(id: string) {
        return this.prisma.networkMap.findUnique({
            where: { id },
        });
    }

    update(id: string, updateNetworkMapDto: UpdateNetworkMapDto) {
        return this.prisma.networkMap.update({
            where: { id },
            data: updateNetworkMapDto,
        });
    }

    remove(id: string) {
        return this.prisma.networkMap.delete({
            where: { id },
        });
    }
}
