import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { RouterOSClient } from 'routeros-client';

@Injectable()
export class ConnectionService {
    constructor(private prisma: PrismaService) { }

    async create(createConnectionDto: CreateConnectionDto) {
        const { secretMode, pppUsername, pppPassword, pppService } = createConnectionDto;

        // 1. Basic existence checks and get data
        const customer = await this.checkPelanggan(createConnectionDto.pelangganId);
        const paket = await this.prisma.package.findUnique({
            where: { id: createConnectionDto.paketId },
            include: { router: true }
        });

        if (!paket) throw new NotFoundException(`Package with ID ${createConnectionDto.paketId} not found`);
        const router = paket.router;

        // Validate based on secretMode
        if (secretMode === 'NEW' || secretMode === 'EXISTING') {
            if (!pppUsername || !pppPassword) {
                throw new BadRequestException('Username dan Password PPP wajib diisi untuk mode NEW atau EXISTING');
            }
        }

        // 2. Handle MikroTik operations based on secretMode
        if (secretMode === 'NEW') {
            // Create new secret in MikroTik
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

                // Check if username already exists in MikroTik
                const existingSecret = await pppMenu.print({ name: pppUsername });
                if (existingSecret.length > 0) {
                    await client.close();
                    throw new BadRequestException(`Username '${pppUsername}' already exists in MikroTik router`);
                }

                // Create PPP Secret in MikroTik
                await pppMenu.add({
                    name: pppUsername,
                    password: pppPassword,
                    service: pppService || 'pppoe',
                    profile: paket.mikrotikProfile,
                    comment: customer.idPelanggan
                });

                await client.close();
            } catch (error) {
                if (error instanceof BadRequestException) throw error;
                throw new InternalServerErrorException(`MikroTik Error: ${error.message}`);
            }
        } else if (secretMode === 'EXISTING') {
            // Verify the secret exists in MikroTik
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

                const existingSecret = await pppMenu.print({ name: pppUsername });
                if (existingSecret.length === 0) {
                    await client.close();
                    throw new BadRequestException(`Secret '${pppUsername}' tidak ditemukan di MikroTik`);
                }

                // Update comment to link with customer
                const secretId = existingSecret[0]['.id'] || existingSecret[0]['id'];
                await pppMenu.where({ '.id': secretId }).update({ comment: customer.idPelanggan });

                await client.close();
            } catch (error) {
                if (error instanceof BadRequestException) throw error;
                throw new InternalServerErrorException(`MikroTik Error: ${error.message}`);
            }
        }
        // For NONE mode, no MikroTik operations needed

        // 3. Save to database
        return this.prisma.connection.create({
            data: {
                pelangganId: createConnectionDto.pelangganId,
                paketId: createConnectionDto.paketId,
                secretMode,
                pppUsername: secretMode !== 'NONE' ? (pppUsername ?? null) : null,
                pppPassword: secretMode !== 'NONE' ? (pppPassword ?? null) : null,
                pppService: secretMode !== 'NONE' ? (pppService ?? 'pppoe') : null,
            },
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
        const connection = await this.findOne(id);
        const router = connection.paket.router;

        // Check if package changed to get new profile
        let newProfile: string | undefined;
        if (updateData.paketId && updateData.paketId !== connection.paketId) {
            const newPaket = await this.prisma.package.findUnique({ where: { id: updateData.paketId } });
            if (newPaket) newProfile = newPaket.mikrotikProfile;
        }

        const secretMode = updateData.secretMode || connection.secretMode;

        // Handle MikroTik sync based on mode
        if (secretMode !== 'NONE' && connection.pppUsername) {
            const client = new RouterOSClient({
                host: router.hostAddress,
                user: router.username,
                password: router.password,
                port: router.apiPort,
                timeout: 5,
            });

            let clientConnected = false;
            try {
                const api: any = await client.connect();
                clientConnected = true;
                const pppMenu = api.menu('/ppp/secret');

                // Find existing secret
                const byName = await pppMenu.print({ name: connection.pppUsername });

                if (byName.length > 0) {
                    const secretId = byName[0]['.id'] || byName[0]['id'];
                    const profileToUse = newProfile || connection.paket.mikrotikProfile;

                    // Update the secret using .set()
                    const updatePayload: any = {};
                    if (updateData.pppUsername && updateData.pppUsername !== connection.pppUsername) {
                        updatePayload.name = updateData.pppUsername;
                    }
                    if (updateData.pppPassword) {
                        updatePayload.password = updateData.pppPassword;
                    }
                    if (updateData.pppService) {
                        updatePayload.service = updateData.pppService;
                    }
                    if (newProfile) {
                        updatePayload.profile = profileToUse;
                    }

                    if (Object.keys(updatePayload).length > 0) {
                        await pppMenu.where({ '.id': secretId }).update(updatePayload);

                        // KICK the active session if profile changed
                        if (newProfile) {
                            const activeMenu = api.menu('/ppp/active');
                            const actives = await activeMenu.print({ name: connection.pppUsername });
                            if (actives.length > 0) {
                                const activeId = actives[0]['.id'] || actives[0]['id'];
                                await activeMenu.remove(activeId);
                                console.log(`[UPGRADE] Kicked active session for ${connection.pppUsername}`);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("MikroTik Sync Error:", error);
                // We don't necessarily want to crash the whole update if MikroTik is down, 
                // but for upgrade/downgrade consistency it's better to log it.
            } finally {
                if (clientConnected) {
                    try { await client.close(); } catch (e) { }
                }
            }
        }

        // Prepare data for database update
        const dbUpdateData: any = {};
        if (updateData.pppUsername !== undefined) dbUpdateData.pppUsername = updateData.pppUsername;
        if (updateData.pppPassword !== undefined) dbUpdateData.pppPassword = updateData.pppPassword;
        if (updateData.pppService !== undefined) dbUpdateData.pppService = updateData.pppService;
        if (updateData.secretMode !== undefined) dbUpdateData.secretMode = updateData.secretMode;
        if (updateData.paketId !== undefined) dbUpdateData.paketId = updateData.paketId;

        return this.prisma.connection.update({
            where: { id },
            data: dbUpdateData,
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

        // Only try to remove from MikroTik if secretMode is NEW (we created it)
        if (connection.secretMode === 'NEW' && connection.pppUsername) {
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

                const secret = await pppMenu.print({ name: connection.pppUsername });
                if (secret.length > 0) {
                    const secretId = secret[0]['.id'] || secret[0]['id'];
                    await pppMenu.remove(secretId);
                }
                await client.close();
            } catch (error) {
                console.error(`Failed to remove secret from MikroTik: ${error.message}`);
            }
        }

        return this.prisma.connection.delete({
            where: { id },
        });
    }

    /**
     * Get available PPP secrets from MikroTik that are not yet used in database
     * Optionally filter by profile
     */
    async getAvailableSecrets(routerId: number, profile?: string) {
        const router = await this.prisma.router.findUnique({ where: { id: routerId } });
        if (!router) throw new NotFoundException(`Router with ID ${routerId} not found`);

        // Get all pppUsernames already used in database
        const usedConnections = await this.prisma.connection.findMany({
            where: { pppUsername: { not: { equals: null } } },
            select: { pppUsername: true }
        });
        const usedUsernames = new Set(usedConnections.map(c => c.pppUsername).filter(Boolean));

        // Connect to MikroTik
        const client = new RouterOSClient({
            host: router.hostAddress,
            user: router.username,
            password: router.password,
            port: router.apiPort,
            timeout: 10,
        });

        try {
            const api: any = await client.connect();
            const pppMenu = api.menu('/ppp/secret');

            // Get all secrets, optionally filter by profile
            let secrets: any[];
            if (profile) {
                secrets = await pppMenu.print({ profile });
            } else {
                secrets = await pppMenu.print();
            }

            await client.close();

            // Filter out secrets that are already used in database
            const availableSecrets = secrets
                .filter((s: any) => !usedUsernames.has(s.name))
                .map((s: any) => ({
                    id: s['.id'] || s['id'],
                    name: s.name,
                    password: s.password || '', // Password mungkin kosong/masked di beberapa versi MikroTik
                    profile: s.profile,
                    service: s.service || 'pppoe',
                    comment: s.comment || '',
                    disabled: s.disabled === 'true' || s.disabled === true,
                }));

            return availableSecrets;
        } catch (error) {
            throw new InternalServerErrorException(`MikroTik Error: ${error.message}`);
        }
    }

    private async checkPelanggan(id: number) {
        const pelanggan = await this.prisma.customer.findUnique({ where: { id } });
        if (!pelanggan) throw new NotFoundException(`Customer with ID ${id} not found`);
        return pelanggan;
    }
}
