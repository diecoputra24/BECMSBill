
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
    console.log('--- AREAS ---');
    const areas = await prisma.area.findMany({ include: { branch: true } });
    areas.forEach(a => console.log(`ID: ${a.id}, Name: ${a.namaArea}, BranchID: ${a.branchId}, Branch: ${a.branch?.namaBranch}`));

    console.log('\n--- CUSTOMERS ---');
    const customers = await prisma.customer.findMany({ include: { area: true } });
    customers.forEach(c => console.log(`ID: ${c.id}, Name: ${c.namaPelanggan}, AreaID: ${c.areaId}, BranchID: ${c.area?.branchId}`));
}

checkData().finally(() => prisma.$disconnect());
