/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `mothers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `mothers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `mothers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `mothers` ADD COLUMN `email` VARCHAR(191) NOT NULL,
    ADD COLUMN `password` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` TEXT NOT NULL,
    `sender` ENUM('MOTHER', 'STAFF') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `motherId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `mothers_email_key` ON `mothers`(`email`);

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_motherId_fkey` FOREIGN KEY (`motherId`) REFERENCES `mothers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
