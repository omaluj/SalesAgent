-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CampaignCompanyStatus" AS ENUM ('ASSIGNED', 'SCHEDULED', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'FAILED', 'COMPLETED', 'NO_SHOW');

-- AlterTable
ALTER TABLE "email_templates" ADD COLUMN     "isSeasonal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "seasonalEnd" TEXT,
ADD COLUMN     "seasonalStart" TEXT,
ADD COLUMN     "targetIndustries" TEXT[],
ADD COLUMN     "targetSizes" TEXT[];

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "templateId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "targetIndustries" TEXT[],
    "targetSizes" TEXT[],
    "targetRegions" TEXT[],
    "sendTime" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Bratislava',
    "maxEmailsPerDay" INTEGER NOT NULL DEFAULT 50,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_companies" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "emailId" TEXT,
    "status" "CampaignCompanyStatus" NOT NULL DEFAULT 'ASSIGNED',

    CONSTRAINT "campaign_companies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "campaign_companies_campaignId_companyId_key" ON "campaign_companies"("campaignId", "companyId");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "email_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_companies" ADD CONSTRAINT "campaign_companies_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_companies" ADD CONSTRAINT "campaign_companies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
