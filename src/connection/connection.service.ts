import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { RouterOSClient } from 'routeros-client';

@Injectable()
export class ConnectionService {
    constructor(private prisma: PrismaService) { }

    async create(createConnectionDto: CreateConnectionDto) {
        // 1. Basic existence checks and get data
        await this.checkPelanggan(createConnectionDto.pelangganId);
        const paket = await this.prisma.package.findUnique({
            where: { id: createConnectionDto.paketId },
            include: { router: true }
        });

        if (!paket) throw new NotFoundException(`Package with ID ${createConnectionDto.paketId} not found`);
        const router = paket.router;

        // 2. Connect to MikroTik
        const client = new RouterOSClient({
            host: router.hostAddress,
            user: router.username,
            password: router.password,
            port: router.apiPort,
            timeout: 5,
        });

        try {
            const api: any = await client.connect();
            const pppMenu = api.menu('/ppp/secret');

            // 3. Check if username already exists in MikroTik
            const existingSecret = await pppMenu.print({
                name: createConnectionDto.pppUsername
            });

            if (existingSecret.length > 0) {
                await client.close();
                throw new BadRequestException(`Username '${createConnectionDto.pppUsername}' already exists in MikroTik router`);
            }

            // 4. Create PPP Secret in MikroTik
            await pppMenu.add({
                name: createConnectionDto.pppUsername,
                password: createConnectionDto.pppPassword,
                service: createConnectionDto.pppService,
                profile: paket.mikrotikProfile,
                comment: `ID Pelanggan: ${createConnectionDto.pelangganId}`
            });

            await client.close();

            // 5. Save to database
            return this.prisma.connection.create({
                data: createConnectionDto,
                include: {
                    pelanggan: true,
                    paket: {
                        include: {
                            router: true,
                        },
                    },
                },
            });

        } catch (error) {
            if (error instanceof BadRequestException) throw error;
            throw new InternalServerErrorException(`MikroTik Error: ${error.message}`);
        }
    }

    async findAll() {
        return this.prisma.connection.findMany({
            include: {
                pelanggan: true,
                paket: {
                    include: {
                        router: true,
                    },
                },
            },
        });
    }

    async findOne(id: number) {
        const connection = await this.prisma.connection.findUnique({
            where: { id },
            include: {
                pelanggan: true,
                paket: {
                    include: {
                        router: true,
                    },
                },
            },
        });
        if (!connection) throw new NotFoundException(`Connection with ID ${id} not found`);
        return connection;
    }

    async update(id: number, updateData: Partial<CreateConnectionDto>) {
        await this.findOne(id);
        return this.prisma.connection.update({
            where: { id },
            data: updateData,
            include: {
                pelanggan: true,
                paket: {
                    include: {
                        router: true,
                    },
                },
            },
        });
    }

    async remove(id: number) {
        const connection = await this.findOne(id);
        const router = connection.paket.router;

        // Try to remove from MikroTik as well
        const client = new RouterOSClient({
            host: router.hostAddress,
            user: router.username,
            password: router.password,
            port: router.apiPort,
            timeout: 5,
        });

        try {
            const api: any = await client.connect();
            const pppMenu = api.menu('/ppp/secret');

            // Find ID in MikroTik
            const secret = await pppMenu.print({
                name: connection.pppUsername
            });

            if (secret.length > 0) {
                await pppMenu.remove(secret[0].id);
            }
            await client.close();
        } catch (error) {
            console.error(`Failed to remove secret from MikroTik: ${error.message}`);
            // We continue to remove from DB even if Mikrotik fails
        }

        return this.prisma.connection.delete({
            where: { id },
        });
    }

    private async checkPelanggan(id: number) {
        const pelanggan = await this.prisma.customer.findUnique({ where: { id } });
        if (!pelanggan) throw new NotFoundException(`Customer with ID ${id} not found`);
        return pelanggan;
    }
}
