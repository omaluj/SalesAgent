import { PrismaClient } from '@prisma/client';
import { campaignService } from '../src/modules/campaigns/campaign.service.js';

const prisma = new PrismaClient();

async function testCampaignService() {
  console.log('🧪 Testujem campaign service...');

  try {
    // 1. Test priameho Prisma dotazu
    console.log('\n1. Test priameho Prisma dotazu:');
    const directCampaigns = await prisma.campaign.findMany({
      include: {
        template: true,
        _count: {
          select: {
            campaignCompanies: true,
          },
        },
      },
    });
    console.log(`✅ Prisma vracia ${directCampaigns.length} kampaní`);
    if (directCampaigns.length > 0) {
      console.log(`   Prvá kampaň: ${directCampaigns[0].name}`);
      console.log(`   Status: ${directCampaigns[0].status}`);
    }

    // 2. Test campaign service
    console.log('\n2. Test campaign service:');
    const serviceCampaigns = await campaignService.getCampaigns({});
    console.log(`✅ Campaign service vracia ${serviceCampaigns.length} kampaní`);
    if (serviceCampaigns.length > 0) {
      console.log(`   Prvá kampaň: ${serviceCampaigns[0].name}`);
      console.log(`   Status: ${serviceCampaigns[0].status}`);
    }

    // 3. Test enhanced template service
    console.log('\n3. Test enhanced template service:');
    const { enhancedTemplateService } = await import('../src/modules/templates/enhanced-template.service.js');
    const templates = await enhancedTemplateService.getTemplates({});
    console.log(`✅ Enhanced template service vracia ${templates.length} šablón`);
    if (templates.length > 0) {
      console.log(`   Prvá šablóna: ${templates[0].name}`);
      console.log(`   Kategória: ${templates[0].category}`);
    }

    // 4. Test priameho Prisma dotazu pre šablóny
    console.log('\n4. Test priameho Prisma dotazu pre šablóny:');
    const directTemplates = await prisma.emailTemplate.findMany({
      include: {
        _count: {
          select: {
            campaigns: true,
          },
        },
      },
    });
    console.log(`✅ Prisma vracia ${directTemplates.length} šablón`);
    if (directTemplates.length > 0) {
      console.log(`   Prvá šablóna: ${directTemplates[0].name}`);
      console.log(`   Kategória: ${directTemplates[0].category}`);
    }

  } catch (error) {
    console.error('❌ Chyba pri teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCampaignService();
