#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import logger from '../src/utils/logger.js';

const prisma = new PrismaClient();

async function createSampleCampaign() {
  try {
    logger.info('Creating sample campaign...');

    // Get a template for schools
    const template = await prisma.emailTemplate.findFirst({
      where: {
        category: 'skolky',
        active: true,
      },
    });

    if (!template) {
      logger.error('No school template found');
      return;
    }

    // Create a sample campaign
    const campaign = await prisma.campaign.create({
      data: {
        name: 'Školský rok 2025/2026 - Škôlky',
        description: 'Kampaň zameraná na školské zariadenia pred začiatkom školského roka',
        templateId: template.id,
        startDate: new Date('2025-08-01'),
        endDate: new Date('2025-09-30'),
        isActive: true,
        targetIndustries: ['Vzdelávanie', 'Škôlky', 'Materinské školy'],
        targetSizes: ['small', 'medium'],
        targetRegions: ['Bratislava', 'Košice', 'Žilina', 'Banská Bystrica'],
        sendTime: '09:00',
        timezone: 'Europe/Bratislava',
        maxEmailsPerDay: 20,
        status: 'ACTIVE',
      },
      include: {
        template: true,
      },
    });

    logger.info('Sample campaign created successfully', {
      campaignId: campaign.id,
      name: campaign.name,
      templateName: campaign.template.name,
    });

    // Create some sample companies for the campaign
    const companies = [
      {
        name: 'Škôlka Veselá',
        website: 'https://skolkavesela.sk',
        email: 'info@skolkavesela.sk',
        phone: '+421 901 123 456',
        address: 'Hlavná 123, Bratislava',
        industry: 'Vzdelávanie',
        size: 'small',
        description: 'Súkromná škôlka s moderným prístupom',
        contactName: 'Mgr. Jana Nováková',
        contactPosition: 'Riaditeľka',
        contactEmail: 'jana.novakova@skolkavesela.sk',
        contactPhone: '+421 901 123 457',
        status: 'PENDING',
        source: 'manual',
      },
      {
        name: 'Materinská škola Slnečnica',
        website: 'https://slnecnica.sk',
        email: 'info@slnecnica.sk',
        phone: '+421 902 234 567',
        address: 'Kvetná 45, Košice',
        industry: 'Vzdelávanie',
        size: 'small',
        description: 'Materinská škola s tradíciou',
        contactName: 'Mgr. Mária Kováčová',
        contactPosition: 'Riaditeľka',
        contactEmail: 'maria.kovacova@slnecnica.sk',
        contactPhone: '+421 902 234 568',
        status: 'PENDING',
        source: 'manual',
      },
      {
        name: 'Škôlka Hravá',
        website: 'https://hravaskolka.sk',
        email: 'info@hravaskolka.sk',
        phone: '+421 903 345 678',
        address: 'Detská 67, Žilina',
        industry: 'Vzdelávanie',
        size: 'medium',
        description: 'Škôlka s hravým prístupom k vzdelávaniu',
        contactName: 'Mgr. Peter Malý',
        contactPosition: 'Riaditeľ',
        contactEmail: 'peter.maly@hravaskolka.sk',
        contactPhone: '+421 903 345 679',
        status: 'PENDING',
        source: 'manual',
      },
    ];

    for (const companyData of companies) {
      try {
        const company = await prisma.company.create({
          data: companyData,
        });

        // Assign company to campaign
        await prisma.campaignCompany.create({
          data: {
            campaignId: campaign.id,
            companyId: company.id,
          },
        });

        logger.info('Company created and assigned to campaign', {
          companyId: company.id,
          companyName: company.name,
          campaignId: campaign.id,
        });
      } catch (error) {
        logger.warn('Company might already exist', { companyName: companyData.name, error });
      }
    }

    logger.info('Sample campaign setup completed successfully');
    
    // Display campaign info
    console.log('\n🎯 Sample Campaign Created:');
    console.log(`   ID: ${campaign.id}`);
    console.log(`   Name: ${campaign.name}`);
    console.log(`   Template: ${campaign.template.name}`);
    console.log(`   Status: ${campaign.status}`);
    console.log(`   Start Date: ${campaign.startDate.toLocaleDateString()}`);
    console.log(`   End Date: ${campaign.endDate.toLocaleDateString()}`);
    console.log(`   Target Industries: ${campaign.targetIndustries.join(', ')}`);
    console.log(`   Max Emails/Day: ${campaign.maxEmailsPerDay}`);

  } catch (error) {
    logger.error('Failed to create sample campaign', { error });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createSampleCampaign()
    .then(() => {
      logger.info('Sample campaign creation completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Sample campaign creation failed', { error });
      process.exit(1);
    });
}
