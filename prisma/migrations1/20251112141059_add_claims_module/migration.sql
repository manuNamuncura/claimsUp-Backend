/*
  Warnings:

  - Added the required column `priority` to the `claims` table without a default value. This is not possible if the table is not empty.
  - Added the required column `severity` to the `claims` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `claims` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `claims` ADD COLUMN `priority` VARCHAR(50) NOT NULL,
    ADD COLUMN `severity` VARCHAR(50) NOT NULL,
    ADD COLUMN `status` VARCHAR(50) NOT NULL DEFAULT 'abierto',
    ADD COLUMN `type` VARCHAR(100) NOT NULL;

-- CreateTable
CREATE TABLE `file_attachments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `filename` VARCHAR(255) NOT NULL,
    `path` VARCHAR(500) NOT NULL,
    `size` INTEGER NULL,
    `mimetype` VARCHAR(100) NULL,
    `claimId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `claim_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `claimId` INTEGER NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `user` VARCHAR(255) NOT NULL,
    `details` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `file_attachments` ADD CONSTRAINT `file_attachments_claimId_fkey` FOREIGN KEY (`claimId`) REFERENCES `claims`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `claim_history` ADD CONSTRAINT `claim_history_claimId_fkey` FOREIGN KEY (`claimId`) REFERENCES `claims`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
