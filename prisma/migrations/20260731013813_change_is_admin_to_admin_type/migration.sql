/*
  Warnings:

  - You are about to drop the column `isAdmin` on the `members` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `members` DROP COLUMN `isAdmin`,
    ADD COLUMN `adminType` ENUM('NONE', 'SYS_ADMIN', 'OPS_ADMIN', 'DEPT_ADMIN') NOT NULL DEFAULT 'NONE';
