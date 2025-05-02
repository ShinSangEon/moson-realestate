-- CreateTable
CREATE TABLE `ApartmentBasic` (
    `kaptCode` VARCHAR(191) NOT NULL,
    `kaptName` VARCHAR(191) NOT NULL,
    `bjdCode` VARCHAR(191) NULL,
    `as1` VARCHAR(191) NULL,
    `as2` VARCHAR(191) NULL,
    `as3` VARCHAR(191) NULL,
    `as4` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`kaptCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
