-- CreateTable
CREATE TABLE `FindRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `phone` VARCHAR(191) NOT NULL,
    `types` VARCHAR(191) NOT NULL,
    `dealType` VARCHAR(191) NOT NULL,
    `leaseTerm` VARCHAR(191) NULL,
    `budget` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `moveIn` VARCHAR(191) NOT NULL,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Favorite` ADD CONSTRAINT `Favorite_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Favorite` ADD CONSTRAINT `Favorite_complexUniqueId_fkey` FOREIGN KEY (`complexUniqueId`) REFERENCES `Apartment_Details`(`complexUniqueId`) ON DELETE RESTRICT ON UPDATE CASCADE;
