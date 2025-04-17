/*
  Warnings:

  - The primary key for the `Property` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `images` on the `Property` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Json`.
  - Added the required column `bathrooms` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Added the required column `complexName` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dong` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pyung` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rooms` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalFloors` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Property` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Property` DROP FOREIGN KEY `Property_agentId_fkey`;

-- AlterTable
ALTER TABLE `Property` DROP PRIMARY KEY,
    ADD COLUMN `bathrooms` INTEGER NOT NULL,
    ADD COLUMN `complexName` VARCHAR(191) NOT NULL,
    ADD COLUMN `dong` VARCHAR(191) NOT NULL,
    ADD COLUMN `isHidden` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `lastVerifiedAt` DATETIME(3) NULL,
    ADD COLUMN `pyung` DOUBLE NOT NULL,
    ADD COLUMN `rooms` INTEGER NOT NULL,
    ADD COLUMN `totalFloors` INTEGER NOT NULL,
    ADD COLUMN `type` VARCHAR(191) NOT NULL,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `images` JSON NOT NULL,
    MODIFY `agentId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- CreateTable
CREATE TABLE `Agent` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `officeName` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(191) NOT NULL,
    `profileImage` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Agent_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApiKey` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ApiKey_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Property` ADD CONSTRAINT `Property_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `Agent`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `Property` RENAME INDEX `Property_agentId_fkey` TO `Property_agentId_idx`;
