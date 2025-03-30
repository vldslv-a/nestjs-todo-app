-- AlterTable
ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "OAuthProfile" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "email" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "profileImage" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OAuthProfile_userId_idx" ON "OAuthProfile"("userId");

-- CreateIndex
CREATE INDEX "OAuthProfile_email_idx" ON "OAuthProfile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthProfile_provider_profileId_key" ON "OAuthProfile"("provider", "profileId");

-- AddForeignKey
ALTER TABLE "OAuthProfile" ADD CONSTRAINT "OAuthProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
