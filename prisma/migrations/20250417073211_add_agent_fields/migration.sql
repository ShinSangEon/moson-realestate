/*
  Warnings:

  - A unique constraint covering the columns `[licenseNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `User` ADD COLUMN `licenseNumber` VARCHAR(191) NULL,
    ADD COLUMN `officeAddress` VARCHAR(191) NULL,
    ADD COLUMN `officeName` VARCHAR(191) NULL,
    ADD COLUMN `phoneNumber` VARCHAR(191) NULL,
    ADD COLUMN `profileImage` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_licenseNumber_key` ON `User`(`licenseNumber`);
