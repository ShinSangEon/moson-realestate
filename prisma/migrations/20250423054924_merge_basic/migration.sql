/*
  Warnings:

  - You are about to drop the `ApartmentBasic` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `kaptName` on table `ApartmentBasicInfo` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `ApartmentBasicInfo` ADD COLUMN `as1` VARCHAR(191) NULL,
    ADD COLUMN `as2` VARCHAR(191) NULL,
    ADD COLUMN `as3` VARCHAR(191) NULL,
    ADD COLUMN `as4` VARCHAR(191) NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `kaptName` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `ApartmentBasic`;
