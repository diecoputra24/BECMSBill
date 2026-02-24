import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouterDto } from './dto/create-router.dto';
import { UpdateRouterDto } from './dto/update-router.dto';
import { RouterOSClient } from 'routeros-client';

@Injectable()
export class RouterService {
    constructor(private prisma: PrismaService) { }

    async create(createRouterDto: CreateRouterDto) {
        const normalized = this.normalizeRouterData(createRouterDto);
        return this.prisma.router.create({
            data: {
                ...normalized,
                apiPort: normalized.apiPort ?? 8728,
                isActive: normalized.isActive ?? true,
            },
        });
    }

    async update(uuid: string, updateRouterDto: UpdateRouterDto) {
        const normalized = this.normalizeRouterData(updateRouterDto);
        return this.prisma.router.update({
            where: { uuid },
            data: {
                ...normalized,
            },
        });
    }

    private normalizeRouterData<T extends CreateRouterDto | UpdateRouterDto>(dto: T): T {
        if (dto.hostAddress && dto.hostAddress.includes(':')) {
            const parts = dto.hostAddress.split(':');
            if (parts.length === 2) {
                const [host, port] = parts;
                dto.hostAddress = host;
                const parsedPort = parseInt(port, 10);
                if (!isNaN(parsedPort)) {
                    dto.apiPort = parsedPort;
                }
            }
        }
        return dto;
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

        client.on('error', (err) => console.error(`[MikroTik Error] ${router.namaRouter}:`, err.message));

        try {
            const api: any = await client.connect();
            const identity = await api.menu('/system/identity').print();
            const resource = await api.menu('/system/resource').print();
            await client.close();
            return {
                status: 'success',
                message: 'Connected to MikroTik successfully',
                identity: {
                    name: identity[0]?.name,
                    version: resource[0]?.version
                },
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

        client.on('error', (err) => console.error(`[MikroTik Error] ${router.namaRouter}:`, err.message));

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

        client.on('error', (err) => console.error(`[MikroTik Error] ${router.namaRouter}:`, err.message));

        try {
            const api: any = await client.connect();
            const profiles = await api.menu('/ppp/profile').print();
            await client.close();
            return profiles;
        } catch (error) {
            throw new InternalServerErrorException(`MikroTik Error: ${error.message}`);
        }
    }

    async setPppSecretProfile(routerId: number, username: string, profile: string) {
        const router = await this.findOne(routerId);
        const client = new RouterOSClient({
            host: router.hostAddress,
            user: router.username,
            password: router.password,
            port: router.apiPort,
            timeout: 10,
        });

        const logKey = `[ROUTER-${router.namaRouter}]`;
        client.on('error', (err) => console.error(`${logKey} Connection Error: ${err.message}`));

        try {
            const api: any = await client.connect();

            // 1. CARI USER BERDASARKAN NAMA (Untuk keamanan total)
            const secrets = await api.menu('/ppp/secret').print({ name: username });

            if (secrets.length > 0) {
                const target = secrets[0];
                const secretId = target['.id'] || target['id'];

                // Pastikan nama SAMA PERSIS sebelum eksekusi
                if (String(target.name).trim().toLowerCase() !== String(username).trim().toLowerCase()) {
                    console.error(`${logKey} SAFETY TRIGGERED! Nama tidak cocok. Menghubungi "${username}" tapi MikroTik malah kasih "${target.name}".`);
                    await client.close();
                    return { status: 'error', message: 'Safety name mismatch' };
                }

                console.log(`${logKey} MENGUPDATE: User="${target.name}" (ID: ${secretId}), Profil: ${target.profile} -> ${profile}`);

                // 2. CEK APAKAH PROFIL SUDAH SAMA (OPTIMISASI PENTING)
                if (target.profile === profile.trim()) {
                    console.log(`${logKey} SKIP: Profil sudah sesuai (${target.profile}). Tidak perlu update.`);
                    await client.close();
                    return { status: 'skipped', message: 'Profile already matches' };
                }

                // 3. UPDATE PROFILE MENGGUNAKAN .set() - MEMPERTAHANKAN SESSION HISTORY
                // Menggunakan ID spesifik untuk menghindari bug yang mengubah secret lain
                await api.menu('/ppp/secret').where({ '.id': secretId }).update({ profile: profile.trim() });
                console.log(`${logKey} SECRET "${username}" PROFILE UPDATED TO "${profile.trim()}"`);

                // 4. VERIFIKASI LANGSUNG
                const verify = await api.menu('/ppp/secret').print({ name: username });
                const newProfile = verify[0]?.profile;
                console.log(`${logKey} HASIL: Profil sekarang "${newProfile}". ${newProfile === profile.trim() ? "SUKSES ✓" : "GAGAL ✗"}`);

                // 5. PUTUS SESI AKTIF (Agar profile baru langsung berlaku)
                const actives = await api.menu('/ppp/active').print({ name: username });
                if (actives.length > 0) {
                    const activeId = actives[0]['.id'] || actives[0]['id'];
                    console.log(`${logKey} MENENDANG SESI AKTIF: ${username} (ID: ${activeId})`);
                    await api.menu('/ppp/active').remove(activeId);
                }

                await client.close();
                return { status: 'success' };
            } else {
                console.error(`${logKey} USER TIDAK DITEMUKAN: "${username}" tidak ada di MikroTik.`);
                await client.close();
                throw new NotFoundException(`User "${username}" tidak ditemukan.`);
            }
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            console.error(`${logKey} EXCEPTION:`, error.message);
            throw new InternalServerErrorException(`Kesalahan MikroTik: ${error.message}`);
        }
    }

    async disablePppSecret(routerId: number, username: string) {
        const router = await this.findOne(routerId);
        const client = new RouterOSClient({
            host: router.hostAddress,
            user: router.username,
            password: router.password,
            port: router.apiPort,
            timeout: 10,
        });

        client.on('error', (err) => console.error(`[MikroTik Error] ${router.namaRouter}:`, err.message));

        try {
            const api: any = await client.connect();
            const secrets = await api.menu('/ppp/secret').print({ name: username });
            if (secrets.length > 0) {
                await api.menu('/ppp/secret').set(secrets[0]['.id'], { disabled: 'yes' });
                const actives = await api.menu('/ppp/active').print({ name: username });
                if (actives.length > 0) {
                    await api.menu('/ppp/active').remove(actives[0]['.id']);
                }
            } else {
                throw new NotFoundException(`PPP Secret "${username}" not found.`);
            }
            await client.close();
            return { status: 'success' };
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerErrorException(`MikroTik Error: ${error.message}`);
        }
    }

    async enablePppSecret(routerId: number, username: string) {
        const router = await this.findOne(routerId);
        const client = new RouterOSClient({
            host: router.hostAddress,
            user: router.username,
            password: router.password,
            port: router.apiPort,
            timeout: 10,
        });

        client.on('error', (err) => console.error(`[MikroTik Error] ${router.namaRouter}:`, err.message));

        try {
            const api: any = await client.connect();
            const secrets = await api.menu('/ppp/secret').print({ name: username });
            if (secrets.length > 0) {
                await api.menu('/ppp/secret').set(secrets[0]['.id'], { disabled: 'no' });
            } else {
                throw new NotFoundException(`PPP Secret "${username}" not found.`);
            }
            await client.close();
            return { status: 'success' };
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerErrorException(`MikroTik Error: ${error.message}`);
        }
    }
}
