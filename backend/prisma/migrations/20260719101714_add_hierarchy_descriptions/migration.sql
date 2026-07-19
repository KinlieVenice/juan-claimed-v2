/*
  Warnings:

  - Added the required column `englishDescription` to the `dim_field_hierarchy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tagalogDescription` to the `dim_field_hierarchy` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "dim_field_hierarchy" ADD COLUMN     "englishDescription" TEXT NOT NULL,
ADD COLUMN     "tagalogDescription" TEXT NOT NULL;
