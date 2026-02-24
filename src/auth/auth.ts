import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { jwt } from 'better-auth/plugins';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

// Create a dedicated Prisma instance for BetterAuth
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
    basePath: '/api/auth',
    secret: process.env.BETTER_AUTH_SECRET || 'cmsbill-super-secret-key-must-be-at-least-32-characters-long',

    database: prismaAdapter(prisma, {
        provider: 'postgresql',
    }),

    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
        autoSignIn: true,
    },

    user: {
        modelName: 'User',
        additionalFields: {
            username: {
                type: 'string',
                required: true,
                unique: true,
                input: true,
            },
            role: {
                type: 'string',
                required: false,
                defaultValue: 'ADMIN',
                input: true,
            },
            branchId: {
                type: 'number',
                required: false,
                input: true,
            },
            roleId: {
                type: 'number', // Ensure roleId is exposed
                required: false,
                input: true,
            },
            theme: {
                type: 'string',
                required: false,
                defaultValue: 'blue',
                input: true,
            },
            position: {
                type: 'string',
                required: false,
                input: true,
            },
            vendorId: {
                type: 'number',
                required: false,
                input: true,
            },
        },
    },

    session: {
        modelName: 'Session',
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24,     // Update session every 24 hours
        cookieCache: {
            enabled: true,
            maxAge: 60 * 5, // Cache for 5 minutes
        },
    },

    account: {
        modelName: 'Account',
    },

    plugins: [
        jwt({
            jwt: {
                expiresIn: 60 * 60, // 1 hour
                definePayload: ({ user }: { user: any }) => ({
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    roleId: user.roleId, // Add roleId to payload
                    branchId: user.branchId, // Add branchId to payload
                    name: user.name,
                    theme: user.theme,
                    position: user.position,
                    vendorId: user.vendorId,
                }),
            },
        }),
    ],

    advanced: {
        database: {
            generateId: (options: { model: string }) => {
                // Generate UUIDs for all tables including user
                return crypto.randomUUID();
            },
        },
        crossSubDomainCookies: {
            enabled: false,
        },
        defaultCookieAttributes: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        },
    },

    trustedOrigins: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ],

});

export type AuthType = typeof auth;
