-- CreateTable
CREATE TABLE `CCTV` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `address` VARCHAR(191) NOT NULL,
    `purpose` VARCHAR(191) NOT NULL,
    `cameraCount` INTEGER NOT NULL,
    `resolution` VARCHAR(191) NOT NULL,
    `direction` VARCHAR(191) NOT NULL,
    `storageDays` INTEGER NOT NULL,
    `installationDate` DATETIME(3) NOT NULL,
    `contactNumber` VARCHAR(191) NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `dataUpdatedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Apartment_Details` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `address` VARCHAR(191) NOT NULL,
    `complexType` VARCHAR(191) NOT NULL,
    `complexNamePublic` VARCHAR(191) NULL,
    `complexNameBuilding` VARCHAR(191) NULL,
    `complexNameRoad` VARCHAR(191) NULL,
    `complexUniqueId` VARCHAR(191) NOT NULL,
    `buildingCount` INTEGER NOT NULL,
    `landUniqueId` VARCHAR(191) NOT NULL,
    `householdCount` INTEGER NOT NULL,
    `approvalDate` DATETIME(3) NOT NULL,
    `buildingName` VARCHAR(191) NULL,
    `floorCount` INTEGER NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Apartment_Marker` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `complexUniqueId` VARCHAR(191) NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
