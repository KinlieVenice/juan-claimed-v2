-- CreateTable
CREATE TABLE "dim_countries" (
    "id" TEXT NOT NULL,
    "numCode" VARCHAR(10) NOT NULL,
    "alpha2Code" VARCHAR(2) NOT NULL,
    "alpha3Code" VARCHAR(3) NOT NULL,
    "enShortName" VARCHAR(255) NOT NULL,
    "nationality" VARCHAR(255) NOT NULL,

    CONSTRAINT "dim_countries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dim_countries_alpha2Code_key" ON "dim_countries"("alpha2Code");

-- CreateIndex
CREATE UNIQUE INDEX "dim_countries_alpha3Code_key" ON "dim_countries"("alpha3Code");
