import bcrypt from 'bcrypt';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: 'default-org' },
    update: {},
    create: { name: 'CloudShield Demo Org', slug: 'default-org' },
  });

  const passwordHash = await bcrypt.hash('ChangeMe123!', 12);

  const user = await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: 'admin@cloudshield.local' } },
    update: {},
    create: {
      organizationId: org.id,
      fullName: 'CloudShield Admin',
      email: 'admin@cloudshield.local',
      passwordHash,
      role: Role.ORG_ADMIN,
      isEmailVerified: true,
    },
  });

  await prisma.project.upsert({
    where: { organizationId_name: { organizationId: org.id, name: 'Default Project' } },
    update: {},
    create: {
      organizationId: org.id,
      createdById: user.id,
      name: 'Default Project',
      description: 'Default project for CloudShield tenant',
    },
  });
  
  await prisma.organizationSettings.upsert({
    where: { organizationId: org.id },
    update: {},
    create: {
      organizationId: org.id,
      activeFrameworks: ['ISO27001', 'SOC2', 'GDPR'],
    }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
