-- CreateTable
CREATE TABLE "fct_benefit_how_to_apply" (
    "id" TEXT NOT NULL,
    "benefitId" TEXT NOT NULL,
    "englishName" VARCHAR(255) NOT NULL,
    "tagalogName" VARCHAR(255) NOT NULL,
    "englishDescription" TEXT NOT NULL,
    "tagalogDescription" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" VARCHAR(255),
    "updatedById" VARCHAR(255),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "fct_benefit_how_to_apply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fct_benefit_how_to_apply_deletedAt_idx" ON "fct_benefit_how_to_apply"("deletedAt");

-- AddForeignKey
ALTER TABLE "fct_benefit_how_to_apply" ADD CONSTRAINT "fct_benefit_how_to_apply_benefitId_fkey" FOREIGN KEY ("benefitId") REFERENCES "fct_benefit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fct_benefit_how_to_apply" ADD CONSTRAINT "fct_benefit_how_to_apply_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fct_benefit_how_to_apply" ADD CONSTRAINT "fct_benefit_how_to_apply_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
