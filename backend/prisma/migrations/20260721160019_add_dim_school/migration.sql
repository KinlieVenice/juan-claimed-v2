-- CreateTable
CREATE TABLE "dim_school" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "dim_school_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DimFieldToDimSchool" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DimFieldToDimSchool_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_DimFieldToDimSchool_B_index" ON "_DimFieldToDimSchool"("B");

-- AddForeignKey
ALTER TABLE "_DimFieldToDimSchool" ADD CONSTRAINT "_DimFieldToDimSchool_A_fkey" FOREIGN KEY ("A") REFERENCES "dim_field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DimFieldToDimSchool" ADD CONSTRAINT "_DimFieldToDimSchool_B_fkey" FOREIGN KEY ("B") REFERENCES "dim_school"("id") ON DELETE CASCADE ON UPDATE CASCADE;
