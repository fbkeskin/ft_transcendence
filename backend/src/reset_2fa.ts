// backend/src/reset_2fa.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Veritabanındaki TÜM kullanıcıların 2FA'sını kapatır.
  // Böylece hangisi kilitli diye aramana gerek kalmaz.
  try {
    await prisma.user.updateMany({
        data: {
            isTwoFactorEnabled: false,
            twoFactorSecret: null
        }
    });
    console.log("✅ BAŞARILI: Tüm kullanıcıların 2FA kilidi kaldırıldı!");
    console.log("🔓 Artık eski hesabınla şifresiz giriş yapabilirsin.");
  } catch (e) {
      console.error("Hata:", e);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());