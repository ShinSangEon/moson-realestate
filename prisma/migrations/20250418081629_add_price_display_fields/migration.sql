/*
  Warnings:

  - You are about to alter the column `price` on the `Property` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `maintenanceFee` on the `Property` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - Added the required column `maintenanceDisplay` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceDisplay` to the `Property` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Property` ADD COLUMN `maintenanceDisplay` VARCHAR(191) NOT NULL,
    ADD COLUMN `priceDisplay` VARCHAR(191) NOT NULL,
    MODIFY `price` INTEGER NOT NULL,
    MODIFY `maintenanceFee` INTEGER NOT NULL;
