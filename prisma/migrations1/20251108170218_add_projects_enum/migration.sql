/*
  Warnings:

  - You are about to alter the column `phone` on the `clients` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(50)`.
  - You are about to alter the column `type` on the `projects` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.

*/
-- DropForeignKey
ALTER TABLE `claims` DROP FOREIGN KEY `claims_clientId_fkey`;

-- DropForeignKey
ALTER TABLE `claims` DROP FOREIGN KEY `claims_projectId_fkey`;

-- DropForeignKey
ALTER TABLE `projects` DROP FOREIGN KEY `projects_clientId_fkey`;

-- DropIndex
DROP INDEX `claims_clientId_fkey` ON `claims`;

-- DropIndex
DROP INDEX `claims_projectId_fkey` ON `claims`;

-- DropIndex
DROP INDEX `projects_clientId_fkey` ON `projects`;

-- AlterTable
ALTER TABLE `claims` MODIFY `title` VARCHAR(255) NOT NULL,
    MODIFY `description` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `clients` MODIFY `name` VARCHAR(255) NOT NULL,
    MODIFY `contact` VARCHAR(255) NULL,
    MODIFY `email` VARCHAR(255) NOT NULL,
    MODIFY `phone` VARCHAR(50) NULL;

-- AlterTable
ALTER TABLE `projects` MODIFY `name` VARCHAR(255) NOT NULL,
    MODIFY `type` ENUM('SOFTWARE', 'MARKETING', 'DISENO', 'CONSULTORIA', 'SOPORTE', 'MANTENIMIENTO', 'IMPLEMENTACION') NOT NULL;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `claims` ADD CONSTRAINT `claims_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `claims` ADD CONSTRAINT `claims_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
