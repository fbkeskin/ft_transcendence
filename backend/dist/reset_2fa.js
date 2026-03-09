"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/reset_2fa.ts
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    try {
        await prisma.user.updateMany({
            data: {
                isTwoFactorEnabled: false,
                twoFactorSecret: null
            }
        });
        console.log("✅ BAŞARILI: Tüm kullanıcıların 2FA kilidi kaldırıldı!");
        console.log("🔓 Artık eski hesabınla şifresiz giriş yapabilirsin.");
    }
    catch (e) {
        console.error("Hata:", e);
    }
}
main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
