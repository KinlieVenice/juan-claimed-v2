-- CreateTable
CREATE TABLE "_DimCountriesToDimField" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DimCountriesToDimField_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_DimCountriesToDimField_B_index" ON "_DimCountriesToDimField"("B");

-- AddForeignKey
ALTER TABLE "_DimCountriesToDimField" ADD CONSTRAINT "_DimCountriesToDimField_A_fkey" FOREIGN KEY ("A") REFERENCES "dim_countries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DimCountriesToDimField" ADD CONSTRAINT "_DimCountriesToDimField_B_fkey" FOREIGN KEY ("B") REFERENCES "dim_field"("id") ON DELETE CASCADE ON UPDATE CASCADE;
