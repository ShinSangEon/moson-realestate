/*
  Warnings:

  - You are about to drop the column `aptDong` on the `ApartmentTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `aptSeq` on the `ApartmentTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `bonbun` on the `ApartmentTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `bubun` on the `ApartmentTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `buyerGbn` on the `ApartmentTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `cdealDay` on the `ApartmentTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `cdealType` on the `ApartmentTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `dealAmount` on the `ApartmentTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `estateAgentSggNm` on the `ApartmentTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `landCd` on the `ApartmentTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `landLeaseholdGbn` on the `ApartmentTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `rgstDate` on the `ApartmentTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `roadNm` on the `ApartmentTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `roadNmBonbun` on the `ApartmentTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `roadNmBubun` on the `ApartmentTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `roadNmCd` on the `ApartmentTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `roadNmSeq` on the `ApartmentTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `roadNmSggCd` on the `ApartmentTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `roadNmbCd` on the `ApartmentTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `sggCd` on the `ApartmentTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `slerGbn` on the `ApartmentTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `umdCd` on the `ApartmentTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `umdNm` on the `ApartmentTransaction` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[kaptCode,dealYear,dealMonth,dealDay,floor,dealType]` on the table `ApartmentTransaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dealType` to the `ApartmentTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `ApartmentTransaction` DROP FOREIGN KEY `ApartmentTransaction_kaptCode_fkey`;

-- DropIndex
DROP INDEX `ApartmentTransaction_kaptCode_dealYear_dealMonth_dealDay_flo_key` ON `ApartmentTransaction`;

-- AlterTable
ALTER TABLE `ApartmentTransaction` DROP COLUMN `aptDong`,
    DROP COLUMN `aptSeq`,
    DROP COLUMN `bonbun`,
    DROP COLUMN `bubun`,
    DROP COLUMN `buyerGbn`,
    DROP COLUMN `cdealDay`,
    DROP COLUMN `cdealType`,
    DROP COLUMN `dealAmount`,
    DROP COLUMN `estateAgentSggNm`,
    DROP COLUMN `landCd`,
    DROP COLUMN `landLeaseholdGbn`,
    DROP COLUMN `rgstDate`,
    DROP COLUMN `roadNm`,
    DROP COLUMN `roadNmBonbun`,
    DROP COLUMN `roadNmBubun`,
    DROP COLUMN `roadNmCd`,
    DROP COLUMN `roadNmSeq`,
    DROP COLUMN `roadNmSggCd`,
    DROP COLUMN `roadNmbCd`,
    DROP COLUMN `sggCd`,
    DROP COLUMN `slerGbn`,
    DROP COLUMN `umdCd`,
    DROP COLUMN `umdNm`,
    ADD COLUMN `dealType` VARCHAR(191) NOT NULL,
    ADD COLUMN `depositAmount` INTEGER NULL,
    ADD COLUMN `monthlyAmount` INTEGER NULL,
    ADD COLUMN `saleAmount` INTEGER NULL,
    MODIFY `buildYear` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `ApartmentTransaction_kaptCode_dealYear_dealMonth_dealDay_flo_key` ON `ApartmentTransaction`(`kaptCode`, `dealYear`, `dealMonth`, `dealDay`, `floor`, `dealType`);

-- -- AddForeignKey
-- ALTER TABLE `Favorite` ADD CONSTRAINT `Favorite_kaptCode_fkey` FOREIGN KEY (`kaptCode`) REFERENCES `ApartmentBasicInfo`(`kaptCode`) ON DELETE RESTRICT ON UPDATE CASCADE;
