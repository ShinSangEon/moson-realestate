/*
  Warnings:

  - A unique constraint covering the columns `[complexUniqueId]` on the table `Apartment_Marker` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Apartment_Marker_complexUniqueId_key` ON `Apartment_Marker`(`complexUniqueId`);
