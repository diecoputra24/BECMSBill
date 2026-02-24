import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { auth } from '../auth/auth';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async create(createUserDto: CreateUserDto) {
    const { roleId, branchId, areaIds, theme, position, vendorId, ...userData } = createUserDto;

    // Check if email or username exists
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: userData.email }, { username: userData.username }]
      }
    });

    if (existing) {
      throw new BadRequestException('Email or Username already exists');
    }

    if (!userData.password) {
      throw new BadRequestException('Password is required');
    }

    try {
      // 1. Create user via BetterAuth (handles password hashing)
      const signUpRes = await auth.api.signUpEmail({
        body: {
          email: userData.email,
          password: userData.password,
          username: userData.username,
          name: userData.name,
        }
      });

      if (!signUpRes.user) {
        throw new BadRequestException('Failed to create user via Auth');
      }

      const userId = signUpRes.user.id;

      // 2. Update Role, Branch, Theme and Connect Areas
      return await this.prisma.user.update({
        where: { id: userId },
        data: {
          roleId: roleId ? Number(roleId) : undefined,
          branchId: branchId ? Number(branchId) : undefined,
          theme: theme || undefined,
          position: position || undefined,
          vendorId: vendorId ? Number(vendorId) : undefined,
          areas: areaIds ? {
            connect: areaIds.map(id => ({ id: Number(id) }))
          } : undefined
        },
        include: {
          userRole: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          },
          branch: true,
          areas: true,
          vendor: true
        }

      });

    } catch (error) {
      console.error(error);
      throw new BadRequestException('Failed to create user: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  findAll() {
    return this.prisma.user.findMany({
      include: {
        userRole: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        },
        branch: true,
        areas: true, // Includes specific areas permissions
        vendor: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userRole: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        },
        branch: true,
        areas: true,
        vendor: true,
      }
    });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }


  async update(id: string, updateUserDto: UpdateUserDto) {
    const { roleId, branchId, areaIds, theme, position, vendorId, ...userData } = updateUserDto;

    // Separate auth-related updates (email, password) vs profile (role, branch, areas)
    // Better-auth might handle email/password updates differently, but Prisma update works for basic fields too if schema matches.
    // However, password update needs hashing. BetterAuth handles that. 
    // If password is provided in update, we should use auth.api.changePassword or similar if supported, 
    // or manually hash it if we know the method. better-auth typically uses scrypt/argon2.
    // For simplicity here, we skip password update via this endpoint unless explicitly asked, 
    // or purely update metadata (role, branch, areas).

    // If password update is needed, it's safer to use separate auth endpoint.
    // We will focus on Role, Branch, Areas here.

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        name: userData.name,
        // email/username: better not change here unless careful with auth sync
        roleId: roleId ? Number(roleId) : undefined,
        branchId: branchId !== undefined ? (branchId ? Number(branchId) : null) : undefined,
        theme: theme || undefined,
        position: position || undefined,
        vendorId: vendorId !== undefined ? (vendorId ? Number(vendorId) : null) : undefined,
        areas: areaIds !== undefined ? {
          set: areaIds.map(aId => ({ id: Number(aId) }))
        } : undefined
      },
      include: {
        userRole: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        },
        branch: true,
        areas: true,
        vendor: true,
      }

    });

    // Invalidate sessions for this user to force refresh/logout
    await this.prisma.session.deleteMany({
      where: { userId: id }
    });

    return updatedUser;
  }

  async remove(id: string) {
    // Delete from DB (cascade should handle sessions)
    return this.prisma.user.delete({
      where: { id }
    });
  }
}
