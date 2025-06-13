/*
  Warnings:

  - A unique constraint covering the columns `[url]` on the table `HealthNews` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "HealthNews_url_key" ON "HealthNews"("url");
