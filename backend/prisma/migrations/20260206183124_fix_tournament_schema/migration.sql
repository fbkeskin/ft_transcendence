/*
  Warnings:

  - You are about to drop the column `name` on the `Tournament` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Tournament` table. All the data in the column will be lost.
  - You are about to drop the column `winnerId` on the `Tournament` table. All the data in the column will be lost.
  - Added the required column `player1` to the `Tournament` table without a default value. This is not possible if the table is not empty.
  - Added the required column `player2` to the `Tournament` table without a default value. This is not possible if the table is not empty.
  - Added the required column `player3` to the `Tournament` table without a default value. This is not possible if the table is not empty.
  - Added the required column `player4` to the `Tournament` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Tournament` table without a default value. This is not possible if the table is not empty.
  - Added the required column `winner` to the `Tournament` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tournament" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "player1" TEXT NOT NULL,
    "player2" TEXT NOT NULL,
    "player3" TEXT NOT NULL,
    "player4" TEXT NOT NULL,
    "winner" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tournament_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Tournament" ("createdAt", "id") SELECT "createdAt", "id" FROM "Tournament";
DROP TABLE "Tournament";
ALTER TABLE "new_Tournament" RENAME TO "Tournament";
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT DEFAULT 'default.png',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isTwoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_User" ("avatar", "createdAt", "email", "id", "isTwoFactorEnabled", "level", "losses", "password", "twoFactorSecret", "username", "wins") SELECT "avatar", "createdAt", "email", "id", "isTwoFactorEnabled", "level", "losses", "password", "twoFactorSecret", "username", "wins" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
