-- AlterTable
ALTER TABLE "fct_user_field_answer" ADD COLUMN     "repeaterGroupId" TEXT;

-- CreateTable
CREATE TABLE "fct_user_field_answer_group" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" VARCHAR(255),
    "updatedById" VARCHAR(255),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "fct_user_field_answer_group_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fct_user_field_answer_userId_fieldId_idx" ON "fct_user_field_answer"("userId", "fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "fct_user_field_answer_fieldId_repeaterGroupId_key" ON "fct_user_field_answer"("fieldId", "repeaterGroupId");

-- AddForeignKey
ALTER TABLE "fct_user_field_answer" ADD CONSTRAINT "fct_user_field_answer_repeaterGroupId_fkey" FOREIGN KEY ("repeaterGroupId") REFERENCES "fct_user_field_answer_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fct_user_field_answer_group" ADD CONSTRAINT "fct_user_field_answer_group_userId_fkey" FOREIGN KEY ("userId") REFERENCES "dim_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fct_user_field_answer_group" ADD CONSTRAINT "fct_user_field_answer_group_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "dim_field"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fct_user_field_answer_group" ADD CONSTRAINT "fct_user_field_answer_group_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fct_user_field_answer_group" ADD CONSTRAINT "fct_user_field_answer_group_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

