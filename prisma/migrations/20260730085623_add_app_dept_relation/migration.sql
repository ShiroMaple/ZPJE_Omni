-- AlterTable
ALTER TABLE `apps` ADD COLUMN `mainDeptId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `apps` ADD CONSTRAINT `apps_mainDeptId_fkey` FOREIGN KEY (`mainDeptId`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
