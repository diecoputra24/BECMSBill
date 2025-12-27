import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouterDto } from './dto/create-router.dto';
import { RouterOSClient } from 'routeros-client';

@Injectable()
export class RouterService {
    constructor(private prisma: PrismaService) { }

    async create(createRouterDto: CreateRouterDto) {
        return this.prisma.router.create({
            data: {
                ...createRouterDto,
                apiPort: createRouterDto.apiPort ?? 8728,
                isActive: createRouterDto.isActive ?? true,
            },
        });
    }

    async findAll() {
        return this.prisma.router.findMany();
    }

    async findOne(id: number) {
        const router = await this.prisma.router.findUnique({
            where: { id },
        });
        if (!router) throw new NotFoundException(`Router with ID ${id} not found`);
        return router;
    }

    async findByUuid(uuid: string) {
        const router = await this.prisma.router.findUnique({
            where: { uuid },
        });
        if (!router) throw new NotFoundException(`Router with UUID ${uuid} not found`);
        return router;
    }

    async remove(uuid: string) {
        return this.prisma.router.delete({
            where: { uuid },
        });
    }

    async testConnection(id: number) {
        const router = await this.findOne(id);
        return this.executeTestConnection(router);
    }

    async testConnectionByUuid(uuid: string) {
        const router = await this.findByUuid(uuid);
        return this.executeTestConnection(router);
    }

    private async executeTestConnection(router: any) {
        const client = new RouterOSClient({
            host: router.hostAddress,
            user: router.username,
            password: router.password,
            port: router.apiPort,
            timeout: 5,
        });

        try {
            const api: any = await client.connect();
            const identity = await api.menu('/system/identity').print();
            await client.close();
            return {
                status: 'success',
                message: 'Connected to MikroTik successfully',
                identity: identity[0],
            };
        } catch (error) {
            return {
                status: 'error',
                message: `Failed to connect: ${error.message}`,
            };
        }
    }

    async getResource(id: number) {
        const router = await this.findOne(id);
        return this.executeGetResource(router);
    }

    async getResourceByUuid(uuid: string) {
        const router = await this.findByUuid(uuid);
        return this.executeGetResource(router);
    }

    private async executeGetResource(router: any) {
        const client = new RouterOSClient({
            host: router.hostAddress,
            user: router.username,
            password: router.password,
            port: router.apiPort,
            timeout: 5,
        });

        try {
            const api: any = await client.connect();
            const resource = await api.menu('/system/resource').print();
            await client.close();
            return resource[0];
        } catch (error) {
            throw new InternalServerErrorException(`MikroTik Error: ${error.message}`);
        }
    }

    async getPppProfiles(id: number) {
        const router = await this.findOne(id);
        return this.executeGetPppProfiles(router);
    }

    async getPppProfilesByUuid(uuid: string) {
        const router = await this.findByUuid(uuid);
        return this.executeGetPppProfiles(router);
    }

    private async executeGetPppProfiles(router: any) {
        const client = new RouterOSClient({
            host: router.hostAddress,
            user: router.username,
            password: router.password,
            port: router.apiPort,
            timeout: 5,
        });

        try {
            const api: any = await client.connect();
            const profiles = await api.menu('/ppp/profile').print();
            await client.close();
            return profiles;
        } catch (error) {
            throw new InternalServerErrorException(`MikroTik Error: ${error.message}`);
        }
    }
}
