/*
  Warnings:

  - A unique constraint covering the columns `[badgeId]` on the table `Badge` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `badgeId` to the `Badge` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Badge` ADD COLUMN `badgeId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Badge_badgeId_key` ON `Badge`(`badgeId`);
