/*
  Warnings:

  - A unique constraint covering the columns `[complexUniqueId]` on the table `Apartment_Details` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE `Favorite` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `complexUniqueId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Favorite_userId_complexUniqueId_key`(`userId`, `complexUniqueId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Apartment_Details_complexUniqueId_key` ON `Apartment_Details`(`complexUniqueId`);
