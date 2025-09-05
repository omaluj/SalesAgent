#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function simpleDebug() {
  try {
    console.log('🔍 Simple Prisma debug...\n');
    
    // Test 1: Count campaigns
    const campaignCount = await prisma.campaign.count();
    console.log('1️⃣ Campaign count:', campaignCount);
    
    // Test 2: Get all campaigns
    const campaigns = await prisma.campaign.findMany({
      include: {
        template: true,
        _count: {
          select: {
            campaignCompanies: true,
          },
        },
      },
    });
    console.log('2️⃣ All campaigns:', campaigns.length);
    
    if (campaigns.length > 0) {
      campaigns.forEach(campaign => {
        console.log(`   - ${campaign.name} (${campaign.status}) - ${campaign._count.campaignCompanies} companies`);
      });
    }
    
    // Test 3: Get active campaigns
    const activeCampaigns = await prisma.campaign.findMany({
      where: { status: 'ACTIVE' },
    });
    console.log('3️⃣ Active campaigns:', activeCampaigns.length);
    
    // Test 4: Get campaign companies
    const campaignCompanies = await prisma.campaignCompany.findMany({
      include: {
        campaign: true,
        company: true,
      },
    });
    console.log('4️⃣ Campaign companies:', campaignCompanies.length);
    
    console.log('\n🎉 Simple debug completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleDebug();
