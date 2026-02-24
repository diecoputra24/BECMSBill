
import 'dotenv/config';
import { auth, prisma } from '../src/auth/auth';

async function resetAdmin() {
    console.log('Script started using shared Prisma instance.');

    try {
        const email = 'admin@cmsbill.com';
        const username = 'admin';

        // 1. Delete existing user(s) matching email OR username
        console.log(`Deleting users with email '${email}' or username '${username}'...`);
        const { count } = await prisma.user.deleteMany({
            where: {
                OR: [
                    { email },
                    { username }
                ]
            }
        });
        console.log(`Deleted ${count} existing user(s).`);

        // 2. Create new user via BetterAuth API
        console.log('Creating new Admin user via BetterAuth API...');

        const newUser = await auth.api.signUpEmail({
            body: {
                email: email, // Re-use email
                password: 'Admin123!',
                name: 'Super Admin',
                username: username, // Re-use username
                role: 'ADMIN',
            },
        });

        if (newUser) {
            console.log('✅ Admin user created successfully via BetterAuth!');
            console.log('ID:', newUser.user.id);
            console.log('Email:', newUser.user.email);
        } else {
            console.error('❌ Failed to create user (No response).');
        }

    } catch (error) {
        console.error('❌ Error during reset:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetAdmin();
