/*
  Warnings:

  - You are about to drop the column `name` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `profileImage` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `licenseNumber` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `officeAddress` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `officeName` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Agent` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[licenseNumber]` on the table `Agent` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `licenseNumber` to the `Agent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `officeAddress` to the `Agent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Agent` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `User_licenseNumber_idx` ON `User`;

-- DropIndex
DROP INDEX `User_licenseNumber_key` ON `User`;

-- AlterTable
ALTER TABLE `Agent` DROP COLUMN `name`,
    DROP COLUMN `phoneNumber`,
    DROP COLUMN `profileImage`,
    ADD COLUMN `licenseNumber` VARCHAR(191) NOT NULL,
    ADD COLUMN `officeAddress` VARCHAR(191) NOT NULL,
    ADD COLUMN `userId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `licenseNumber`,
    DROP COLUMN `officeAddress`,
    DROP COLUMN `officeName`;

-- CreateIndex
CREATE UNIQUE INDEX `Agent_userId_key` ON `Agent`(`userId`);

-- CreateIndex
CREATE UNIQUE INDEX `Agent_licenseNumber_key` ON `Agent`(`licenseNumber`);

-- AddForeignKey
ALTER TABLE `Agent` ADD CONSTRAINT `Agent_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
