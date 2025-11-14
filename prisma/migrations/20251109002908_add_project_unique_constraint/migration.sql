/*
  Warnings:

  - A unique constraint covering the columns `[name,clientId]` on the table `projects` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `projects_name_clientId_key` ON `projects`(`name`, `clientId`);
