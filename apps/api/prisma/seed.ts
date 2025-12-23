import { PrismaClient, AdminRole, WelcomeType, PaymentProviderType } from '@prisma/client';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'changeme';
  const tenantName = 'Sample Tenant';

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const tenant = await prisma.tenant.upsert({
    where: { name: tenantName },
    update: {},
    create: {
      name: tenantName,
      botToken: process.env.DEFAULT_BOT_TOKEN || 'set-me',
      isActive: true,
      rentalStart: new Date(),
      rentalEnd: null,
      settings: {
        create: {
          welcomeType: WelcomeType.TEXT,
          welcomeText: 'Selamat datang di bot sample kami!'
        }
      },
      paymentSettings: {
        create: {
          provider: PaymentProviderType.PAKASIR,
          projectSlug: 'sample-project',
          apiKeyEnc: 'encrypted-api-key-placeholder',
          mode: 'url'
        }
      },
      categories: {
        create: [
          {
            name: 'Default Category',
            sortOrder: 1,
            products: {
              create: [
                {
                  name: 'Sample Product',
                  description: 'Produk contoh untuk menguji alur bot',
                  sortOrder: 1,
                  variants: {
                    create: [
                      {
                        name: 'Varian A',
                        price: 10000,
                        stock: 2,
                        stockItems: {
                          create: [
                            { content: 'akun1@example.com+PasswordA' },
                            { content: 'akun2@example.com+PasswordB' }
                          ]
                        }
                      },
                      { name: 'Varian B', price: 20000, stock: 50 }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    }
  });

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: AdminRole.SUPERADMIN },
    create: {
      email: adminEmail,
      passwordHash,
      role: AdminRole.SUPERADMIN,
      tenantId: null
    }
  });

  await prisma.user.upsert({
    where: { tgUserId_tenantId: { tgUserId: 'seed-user', tenantId: tenant.id } },
    update: {},
    create: {
      tgUserId: 'seed-user',
      tenantId: tenant.id,
      username: 'seeduser',
      firstName: 'Seed',
      lastName: 'User',
      balance: 0
    }
  });

  await prisma.order.create({
    data: {
      tenantId: tenant.id,
      userId: (await prisma.user.findFirstOrThrow({ where: { tenantId: tenant.id } })).id,
      variantId: (await prisma.productVariant.findFirstOrThrow({ where: { product: { tenantId: tenant.id } } })).id,
      orderCode: `SEED-${nanoid(6)}`,
      status: 'PENDING',
      amount: 10000,
      qty: 1
    }
  });

  console.log('Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
