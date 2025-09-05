#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking database content...\n');

    // Check campaigns
    console.log('📊 Campaigns:');
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
    
    if (campaigns.length === 0) {
      console.log('   ❌ No campaigns found');
    } else {
      campaigns.forEach(campaign => {
        console.log(`   ✅ ${campaign.name} (${campaign.status}) - ${campaign._count.campaignCompanies} companies`);
        console.log(`      Template: ${campaign.template.name}`);
        console.log(`      Date: ${campaign.startDate.toLocaleDateString()} - ${campaign.endDate.toLocaleDateString()}`);
      });
    }

    // Check companies
    console.log('\n🏢 Companies:');
    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: {
            campaignCompanies: true,
          },
        },
      },
    });
    
    if (companies.length === 0) {
      console.log('   ❌ No companies found');
    } else {
      companies.forEach(company => {
        console.log(`   ✅ ${company.name} (${company.industry}) - ${company._count.campaignCompanies} campaigns`);
      });
    }

    // Check email templates
    console.log('\n📧 Email Templates:');
    const templates = await prisma.emailTemplate.findMany({
      include: {
        _count: {
          select: {
            campaigns: true,
          },
        },
      },
    });
    
    if (templates.length === 0) {
      console.log('   ❌ No templates found');
    } else {
      templates.forEach(template => {
        console.log(`   ✅ ${template.name} (${template.category}) - ${template._count.campaigns} campaigns`);
        if (template.isSeasonal) {
          console.log(`      Seasonal: ${template.seasonalStart} - ${template.seasonalEnd}`);
        }
      });
    }

    // Check campaign companies
    console.log('\n🔗 Campaign Companies:');
    const campaignCompanies = await prisma.campaignCompany.findMany({
      include: {
        campaign: true,
        company: true,
      },
    });
    
    if (campaignCompanies.length === 0) {
      console.log('   ❌ No campaign companies found');
    } else {
      campaignCompanies.forEach(cc => {
        console.log(`   ✅ ${cc.company.name} -> ${cc.campaign.name} (${cc.status})`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkDatabase()
    .then(() => {
      console.log('\n🎉 Database check completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database check failed:', error);
      process.exit(1);
    });
}
