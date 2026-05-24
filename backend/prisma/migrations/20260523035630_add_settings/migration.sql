-- CreateTable
CREATE TABLE "OrganizationSettings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "orgName" TEXT NOT NULL DEFAULT 'Government of India — IT Dept.',
    "cloudRegion" TEXT NOT NULL DEFAULT 'ap-south-1 (Mumbai)',
    "auditFrequency" TEXT NOT NULL DEFAULT 'Daily',
    "emailAlerts" BOOLEAN NOT NULL DEFAULT true,
    "smsAlerts" BOOLEAN NOT NULL DEFAULT false,
    "alertThreshold" TEXT NOT NULL DEFAULT 'Warning & above',
    "activeFrameworks" JSONB NOT NULL DEFAULT '["PDPB 2023", "ISO 27001"]',
    "retentionPeriod" TEXT NOT NULL DEFAULT '365 days',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationSettings_organizationId_key" ON "OrganizationSettings"("organizationId");

-- AddForeignKey
ALTER TABLE "OrganizationSettings" ADD CONSTRAINT "OrganizationSettings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
