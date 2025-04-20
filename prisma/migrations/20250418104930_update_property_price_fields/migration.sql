/*
  Warnings:

  - You are about to drop the column `maintenanceDisplay` on the `Property` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Property` DROP COLUMN `maintenanceDisplay`,
    ADD COLUMN `deposit` INTEGER NULL,
    ADD COLUMN `depositDisplay` VARCHAR(191) NULL,
    ADD COLUMN `monthlyDisplay` VARCHAR(191) NULL,
    ADD COLUMN `monthlyFee` INTEGER NULL,
    MODIFY `maintenanceFee` VARCHAR(191) NOT NULL;
