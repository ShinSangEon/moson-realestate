-- AddForeignKey
ALTER TABLE `ApartmentTransaction` ADD CONSTRAINT `ApartmentTransaction_kaptCode_fkey` FOREIGN KEY (`kaptCode`) REFERENCES `ApartmentBasicInfo`(`kaptCode`) ON DELETE RESTRICT ON UPDATE CASCADE;
