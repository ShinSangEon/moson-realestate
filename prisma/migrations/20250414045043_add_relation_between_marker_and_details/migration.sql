-- CreateTable
CREATE TABLE `Dong_Boundary` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dongName` VARCHAR(191) NOT NULL,
    `boundary` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Dong_Boundary_dongName_key`(`dongName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Apartment_Marker` ADD CONSTRAINT `Apartment_Marker_complexUniqueId_fkey` FOREIGN KEY (`complexUniqueId`) REFERENCES `Apartment_Details`(`complexUniqueId`) ON DELETE RESTRICT ON UPDATE CASCADE;
