/*
  Warnings:

  - You are about to drop the column `classfication` on the `dim_field` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "dim_field" DROP COLUMN "classfication",
ADD COLUMN     "classification" "FieldClassification" NOT NULL DEFAULT 'FOLLOW_UP';
