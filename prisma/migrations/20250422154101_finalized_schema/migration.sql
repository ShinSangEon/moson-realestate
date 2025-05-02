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
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'user',
    `phoneNumber` VARCHAR(191) NULL,
    `profileImage` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `nickname` VARCHAR(191) NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Agent` (
    `id` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `officeName` VARCHAR(191) NOT NULL,
    `officeAddress` VARCHAR(191) NOT NULL,
    `licenseNumber` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Agent_userId_key`(`userId`),
    UNIQUE INDEX `Agent_email_key`(`email`),
    UNIQUE INDEX `Agent_licenseNumber_key`(`licenseNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Favorite` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `kaptCode` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Favorite_userId_kaptCode_key`(`userId`, `kaptCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- CreateTable
CREATE TABLE `SellRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `phone` VARCHAR(191) NOT NULL,
    `propertyType` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `price` VARCHAR(191) NOT NULL,
    `dealType` VARCHAR(191) NOT NULL,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Post` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `category` VARCHAR(191) NOT NULL,
    `views` INTEGER NOT NULL DEFAULT 0,
    `authorId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Comment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` VARCHAR(191) NOT NULL,
    `postId` INTEGER NOT NULL,
    `authorId` INTEGER NOT NULL,
    `parentId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Report` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kaptCode` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `price` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reportId` INTEGER NOT NULL,
    `amount` INTEGER NOT NULL,
    `method` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Payment_reportId_key`(`reportId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- CreateTable
CREATE TABLE `Property` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `dong` VARCHAR(191) NOT NULL,
    `complexName` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT '주택',
    `price` INTEGER NOT NULL,
    `priceDisplay` VARCHAR(191) NOT NULL,
    `area` DOUBLE NOT NULL,
    `pyung` DOUBLE NOT NULL,
    `floor` INTEGER NOT NULL,
    `totalFloors` INTEGER NOT NULL,
    `rooms` INTEGER NOT NULL,
    `bathrooms` INTEGER NOT NULL,
    `maintenanceFee` VARCHAR(191) NOT NULL,
    `monthlyFee` INTEGER NULL,
    `monthlyDisplay` VARCHAR(191) NULL,
    `deposit` INTEGER NULL,
    `depositDisplay` VARCHAR(191) NULL,
    `direction` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `images` JSON NOT NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `isHidden` BOOLEAN NOT NULL DEFAULT false,
    `lastVerifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,

    INDEX `Property_agentId_idx`(`agentId`),
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
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ApiKey_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApartmentBasicInfo` (
    `kaptCode` VARCHAR(191) NOT NULL,
    `kaptName` VARCHAR(191) NULL,
    `kaptAddr` VARCHAR(191) NULL,
    `codeSaleNm` VARCHAR(191) NULL,
    `codeHeatNm` VARCHAR(191) NULL,
    `kaptTarea` DOUBLE NULL,
    `kaptDongCnt` INTEGER NULL,
    `kaptdaCnt` VARCHAR(191) NULL,
    `kaptBcompany` VARCHAR(191) NULL,
    `kaptAcompany` VARCHAR(191) NULL,
    `kaptTel` VARCHAR(191) NULL,
    `kaptFax` VARCHAR(191) NULL,
    `kaptUrl` VARCHAR(191) NULL,
    `codeAptNm` VARCHAR(191) NULL,
    `doroJuso` VARCHAR(191) NULL,
    `hoCnt` INTEGER NULL,
    `codeMgrNm` VARCHAR(191) NULL,
    `codeHallNm` VARCHAR(191) NULL,
    `kaptUsedate` VARCHAR(191) NULL,
    `kaptMarea` DOUBLE NULL,
    `kaptMparea60` DOUBLE NULL,
    `kaptMparea85` DOUBLE NULL,
    `kaptMparea135` DOUBLE NULL,
    `kaptMparea136` DOUBLE NULL,
    `privArea` DOUBLE NULL,
    `bjdCode` VARCHAR(191) NULL,
    `kaptTopFloor` INTEGER NULL,
    `ktownFlrNo` INTEGER NULL,
    `kaptBaseFloor` INTEGER NULL,
    `kaptdEcntp` INTEGER NULL,
    `zipcode` VARCHAR(191) NULL,

    PRIMARY KEY (`kaptCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApartmentDetailedInfo` (
    `kaptCode` VARCHAR(191) NOT NULL,
    `kaptName` VARCHAR(191) NULL,
    `codeMgr` VARCHAR(191) NULL,
    `kaptMgrCnt` INTEGER NULL,
    `kaptCcompany` VARCHAR(191) NULL,
    `codeSec` VARCHAR(191) NULL,
    `kaptdScnt` INTEGER NULL,
    `kaptdSecCom` VARCHAR(191) NULL,
    `codeClean` VARCHAR(191) NULL,
    `kaptdClcnt` INTEGER NULL,
    `codeGarbage` VARCHAR(191) NULL,
    `codeDisinf` VARCHAR(191) NULL,
    `kaptdDcnt` INTEGER NULL,
    `disposalType` VARCHAR(191) NULL,
    `codeStr` VARCHAR(191) NULL,
    `kaptdEcapa` INTEGER NULL,
    `codeEcon` VARCHAR(191) NULL,
    `codeEmgr` VARCHAR(191) NULL,
    `codeFalarm` VARCHAR(191) NULL,
    `codeWsupply` VARCHAR(191) NULL,
    `codeElev` VARCHAR(191) NULL,
    `kaptdEcnt` INTEGER NULL,
    `kaptdPcnt` INTEGER NULL,
    `kaptdPcntu` INTEGER NULL,
    `codeNet` VARCHAR(191) NULL,
    `kaptdCccnt` INTEGER NULL,
    `welfareFacility` VARCHAR(191) NULL,
    `kaptdWtimebus` VARCHAR(191) NULL,
    `subwayLine` VARCHAR(191) NULL,
    `subwayStation` VARCHAR(191) NULL,
    `kaptdWtimesub` VARCHAR(191) NULL,
    `convenientFacility` VARCHAR(191) NULL,
    `educationFacility` VARCHAR(191) NULL,
    `groundElChargerCnt` INTEGER NULL,
    `undergroundElChargerCnt` INTEGER NULL,

    PRIMARY KEY (`kaptCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApartmentTransaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kaptCode` VARCHAR(191) NOT NULL,
    `dealAmount` INTEGER NOT NULL,
    `area` DOUBLE NOT NULL,
    `dealYear` INTEGER NOT NULL,
    `dealMonth` INTEGER NOT NULL,
    `dealDay` INTEGER NOT NULL,
    `floor` INTEGER NOT NULL,
    `aptNm` VARCHAR(191) NULL,
    `jibun` VARCHAR(191) NULL,
    `buildYear` INTEGER NOT NULL,
    `aptSeq` VARCHAR(191) NULL,
    `cdealType` VARCHAR(191) NULL,
    `cdealDay` VARCHAR(191) NULL,
    `slerGbn` VARCHAR(191) NULL,
    `buyerGbn` VARCHAR(191) NULL,
    `rgstDate` VARCHAR(191) NULL,
    `sggCd` VARCHAR(191) NULL,
    `umdCd` VARCHAR(191) NULL,
    `landCd` VARCHAR(191) NULL,
    `bonbun` VARCHAR(191) NULL,
    `bubun` VARCHAR(191) NULL,
    `roadNm` VARCHAR(191) NULL,
    `roadNmSggCd` VARCHAR(191) NULL,
    `roadNmCd` VARCHAR(191) NULL,
    `roadNmSeq` VARCHAR(191) NULL,
    `roadNmbCd` VARCHAR(191) NULL,
    `roadNmBonbun` VARCHAR(191) NULL,
    `roadNmBubun` VARCHAR(191) NULL,
    `umdNm` VARCHAR(191) NULL,
    `aptDong` VARCHAR(191) NULL,
    `landLeaseholdGbn` VARCHAR(191) NULL,
    `estateAgentSggNm` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ApartmentTransaction_kaptCode_dealYear_dealMonth_dealDay_flo_key`(`kaptCode`, `dealYear`, `dealMonth`, `dealDay`, `floor`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Agent` ADD CONSTRAINT `Agent_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Favorite` ADD CONSTRAINT `Favorite_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Favorite` ADD CONSTRAINT `Favorite_kaptCode_fkey` FOREIGN KEY (`kaptCode`) REFERENCES `ApartmentBasicInfo`(`kaptCode`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Comment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_kaptCode_fkey` FOREIGN KEY (`kaptCode`) REFERENCES `ApartmentBasicInfo`(`kaptCode`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `Report`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Property` ADD CONSTRAINT `Property_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `Agent`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ApartmentDetailedInfo` ADD CONSTRAINT `ApartmentDetailedInfo_kaptCode_fkey` FOREIGN KEY (`kaptCode`) REFERENCES `ApartmentBasicInfo`(`kaptCode`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ApartmentTransaction` ADD CONSTRAINT `ApartmentTransaction_kaptCode_fkey` FOREIGN KEY (`kaptCode`) REFERENCES `ApartmentBasicInfo`(`kaptCode`) ON DELETE RESTRICT ON UPDATE CASCADE;
