import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RoleService {
    constructor(private prisma: PrismaService) { }

    async create(createRoleDto: CreateRoleDto) {
        const { permissionIds, ...roleData } = createRoleDto;

        return this.prisma.role.create({
            data: {
                ...roleData,
                permissions: permissionIds ? {
                    create: permissionIds.map(permissionId => ({ permissionId }))
                } : undefined
            },
            include: {
                permissions: {
                    include: {
                        permission: true
                    }
                }
            }
        });
    }

    async findAll() {
        return this.prisma.role.findMany({
            include: {
                permissions: {
                    include: {
                        permission: true
                    }
                },
                users: {
                    select: { id: true, name: true, email: true } // Limit user info
                }
            }
        });
    }

    async findOne(id: number) {
        return this.prisma.role.findUnique({
            where: { id },
            include: {
                permissions: {
                    include: {
                        permission: true
                    }
                }
            }
        });
    }

    async update(id: number, updateRoleDto: UpdateRoleDto) {
        const { permissionIds, ...roleData } = updateRoleDto;

        // Connect/Disconnect logic for permissions involves deleting existing and creating new relations
        // Simplified: Delete all relations and re-create if permissionIds provided

        if (permissionIds) {
            await this.prisma.rolePermission.deleteMany({
                where: { roleId: id }
            });
        }

        const updatedRole = await this.prisma.role.update({
            where: { id },
            data: {
                ...roleData,
                permissions: permissionIds ? {
                    create: permissionIds.map(permissionId => ({ permissionId }))
                } : undefined
            },
            include: {
                permissions: {
                    include: { permission: true }
                }
            }
        });

        // Invalidate sessions for users with this role
        await this.prisma.session.deleteMany({
            where: { user: { roleId: id } }
        });

        return updatedRole;
    }

    async remove(id: number) {
        return this.prisma.role.delete({
            where: { id }
        });
    }
}
