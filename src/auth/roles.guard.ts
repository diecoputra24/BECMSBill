import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private prisma: PrismaService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        // better-auth attaches user to request.user or request.session.user
        const user = request.user || request.session?.user;

        if (!user) {
            console.error('[RolesGuard] No user found in request');
            return false;
        }

        // SUPERADMIN has access to everything
        if (user.role === 'SUPERADMIN') {
            return true;
        }

        // 1. Check direct role string match (e.g., @Roles('ADMIN'))
        if (requiredRoles.includes(user.role)) {
            return true;
        }

        // 2. Check granular permissions if user has a roleId
        const roleId = user.roleId || user.userRole?.id;

        if (roleId) {
            const roleWithPermissions = await this.prisma.role.findUnique({
                where: { id: Number(roleId) },
                include: {
                    permissions: {
                        include: { permission: true }
                    }
                }
            });

            if (roleWithPermissions) {
                const userPermissions = roleWithPermissions.permissions.map(p => p.permission.name);

                // Permission logic:
                // Check if any of the user's granular permissions match the required strings
                // OR if they grant general access to Finance/Admin features
                const hasPermission = userPermissions.some(up =>
                    requiredRoles.includes(up) ||
                    (requiredRoles.includes('ADMIN') && up.startsWith('system.')) ||
                    (requiredRoles.includes('ADMIN') && up.startsWith('infra.')) ||
                    (requiredRoles.includes('FINANCE') && up.startsWith('billing.')) ||
                    (requiredRoles.includes('FINANCE') && up.startsWith('payment.'))
                );

                if (hasPermission) {
                    return true;
                }
            }
        }

        console.warn(`[RolesGuard] Access denied for user ${user.email}. Required: ${requiredRoles}. User role: ${user.role}`);
        return false;
    }
}
