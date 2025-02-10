-- CreateTable
CREATE TABLE "TempreatureCheckin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,
    "tempreature" REAL NOT NULL,
    "threshold" REAL NOT NULL,
    CONSTRAINT "TempreatureCheckin_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TempreatureClient" ("clientId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TempreatureClient" (
    "clientId" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false
);
