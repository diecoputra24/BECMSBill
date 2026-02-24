import { auth, prisma } from '../src/auth/auth';

async function main() {
    console.log('Starting seed...');

    // 1. Branch removed.


    // 2. Define all permissions based on features
    const permissions = [
        // Dashboard
        { name: 'dashboard.view', description: 'View Dashboard' },

        // Opportunity
        { name: 'opportunity.view', description: 'View Opportunity Menu' },
        { name: 'opportunity.create', description: 'Create Opportunity/Customer Registration' },
        { name: 'opportunity.track', description: 'Track Opportunity' },
        { name: 'opportunity.list', description: 'List Opportunities' },
        { name: 'opportunity.detail', description: 'View Opportunity Detail' },

        // Pelanggan (Customer)
        { name: 'customer.view', description: 'View Customer Menu' },
        { name: 'customer.list', description: 'List Customers' },
        { name: 'customer.upgrade', description: 'Request/Approve Upgrade' },
        { name: 'customer.change', description: 'Request/Approve Data Change' },
        { name: 'customer.status', description: 'Request/Approve Status Change' },
        { name: 'customer.connection', description: 'Request/Approve Connection Change' },

        // Billing
        { name: 'billing.view', description: 'View Billing Menu' },
        { name: 'billing.invoice.view', description: 'View Invoices' },
        { name: 'billing.transaction.view', description: 'View Transactions' },
        { name: 'billing.promise.view', description: 'View Promise to Pay' },

        // EIS
        { name: 'eis.view', description: 'View EIS Menu' },
        { name: 'eis.summary', description: 'View EIS Summary' },
        { name: 'eis.revenue', description: 'View Revenue Analysis' },
        { name: 'eis.growth', description: 'View Growth Statistics' },
        { name: 'eis.operational', description: 'View Operational Performance' },

        // Layanan (Services)
        { name: 'service.view', description: 'View Services Menu' },
        { name: 'service.package.view', description: 'View Packages' },
        { name: 'service.package.create', description: 'Create/Edit Packages' },
        { name: 'service.addon.view', description: 'View Addons' },
        { name: 'service.addon.create', description: 'Create/Edit Addons' },
        { name: 'service.discount.view', description: 'View Discounts' },
        { name: 'service.discount.create', description: 'Create/Edit Discounts' },
        { name: 'service.ppn.view', description: 'View PPN' },

        // Mapping
        { name: 'mapping.view', description: 'View Mapping Menu' },
        { name: 'mapping.calculator', description: 'Use Attenuation Calculator' },
        { name: 'mapping.network', description: 'View Network Map' },

        // Infrastructure
        { name: 'infra.view', description: 'View Infrastructure Menu' },
        { name: 'infra.area.view', description: 'View Areas' },
        { name: 'infra.area.create', description: 'Create/Edit Areas' },
        { name: 'infra.odp.view', description: 'View ODPs' },
        { name: 'infra.odp.create', description: 'Create/Edit ODPs' },

        // System
        { name: 'system.view', description: 'View System Menu' },
        { name: 'system.router.view', description: 'View Routers' },
        { name: 'system.router.create', description: 'Create/Edit Routers' },
        { name: 'system.branch.view', description: 'View Branches' },
        { name: 'system.branch.create', description: 'Create/Edit Branches' },
        { name: 'system.role.view', description: 'View Roles & Permissions' },
        { name: 'system.role.create', description: 'Create/Edit Roles & Permissions' },
        { name: 'system.settings.view', description: 'View General Settings' },
        { name: 'system.theme.view', description: 'View Theme Settings' },
        { name: 'system.user.view', description: 'View Users' },
        { name: 'system.user.create', description: 'Create Users' },
        { name: 'system.user.edit', description: 'Edit Users' },
        { name: 'system.user.delete', description: 'Delete Users' },
    ];

    console.log(`Upserting ${permissions.length} permissions...`);
    for (const perm of permissions) {
        await prisma.permission.upsert({
            where: { name: perm.name },
            update: { description: perm.description },
            create: perm,
        });
    }

    // 3. Create Roles
    const rolesData = ['SUPERADMIN', 'ADMIN', 'FINANCE', 'TEKNISI'];
    for (const roleName of rolesData) {
        await prisma.role.upsert({
            where: { name: roleName },
            update: {},
            create: { name: roleName, description: `Role for ${roleName}` }
        });
        console.log(`Role upserted: ${roleName}`);
    }

    // 4. Assign ALL permissions to SUPERADMIN
    const superadminRole = await prisma.role.findUnique({ where: { name: 'SUPERADMIN' } });
    if (superadminRole) {
        console.log('Assigning all permissions to SUPERADMIN...');
        const allPermissions = await prisma.permission.findMany();

        // Use a transaction or just delete existing relations to avoid duplicates
        // For seeding, it's safe to clear relations for this role first (optional but cleaner)
        await prisma.rolePermission.deleteMany({ where: { roleId: superadminRole.id } });

        const rolePermissionsData = allPermissions.map(p => ({
            roleId: superadminRole.id,
            permissionId: p.id
        }));

        await prisma.rolePermission.createMany({
            data: rolePermissionsData,
            skipDuplicates: true
        });
        console.log(`Assigned ${rolePermissionsData.length} permissions to SUPERADMIN.`);
    }

    // 5. Create Users
    const users = [
        {
            name: 'Super Admin',
            email: 'superadmin@cmsbill.com',
            role: 'SUPERADMIN',
            username: 'superadmin',
            password: 'SuperSecretPassword123!',
            branchId: null,
        },
        // ... (Other users can be added here)
        {
            name: 'Admin Branch',
            email: 'admin@cmsbill.com',
            role: 'ADMIN',
            username: 'admin',
            password: 'AdminPassword123!',
            branchId: null,
        },
    ];

    for (const userData of users) {
        // Find corresponding Role to get ID
        const role = await prisma.role.findUnique({ where: { name: userData.role } });

        const existingUser = await prisma.user.findUnique({
            where: { email: userData.email },
        });

        if (!existingUser) {
            console.log(`Creating user: ${userData.email}`);
            try {
                // Determine branchId - if branch is null (e.g. create failed), this might be undefined, handle gracefully
                const finalBranchId = userData.branchId ?? null;

                const { user } = await auth.api.signUpEmail({
                    body: {
                        email: userData.email,
                        password: userData.password,
                        name: userData.name,
                        username: userData.username,
                        role: userData.role,
                        branchId: finalBranchId,
                    }
                });

                if (user && role) {
                    // Update roleId immediately after creation
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { roleId: role.id }
                    });
                    console.log(`Created user: ${userData.email} with roleId: ${role.id}`);
                }
            } catch (error) {
                console.error(`Failed to create user ${userData.email}:`, error);
            }
        } else {
            // Sync roleId if missing or incorrect
            if (role && existingUser.roleId !== role.id) {
                console.log(`Updating roleId for ${userData.email}`);
                await prisma.user.update({
                    where: { email: userData.email },
                    data: { roleId: role.id }
                });
            }
            console.log(`User already exists: ${userData.email}`);
        }
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
