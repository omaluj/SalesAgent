import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const seedData = async (): Promise<void> => {
  try {
    logger.info('Starting database seeding...');

    // Seed email templates
    const templates = [
      {
        name: 'skolky-intro',
        subject: 'Domelia.sk - Digitálne riešenia pre vašu škôlku',
        content: `
          <h2>Dobrý deň,</h2>
          <p>Som z Domelia.sk a zaujímam sa o digitálne riešenia pre školské zariadenia.</p>
          <p>Ponúkame:</p>
          <ul>
            <li>Webové stránky pre škôlky</li>
            <li>Digitálne komunikácie s rodičmi</li>
            <li>Online registrácie</li>
          </ul>
          <p>Môžeme sa stretnúť na krátku konzultáciu?</p>
          <p>S pozdravom,<br>Domelia.sk</p>
        `,
        category: 'skolky',
        variables: ['companyName', 'contactName'],
      },
      {
        name: 'firmy-intro',
        subject: 'Domelia.sk - Moderné webové riešenia pre vašu firmu',
        content: `
          <h2>Dobrý deň,</h2>
          <p>Som z Domelia.sk a špecializujeme sa na moderné webové riešenia.</p>
          <p>Ponúkame:</p>
          <ul>
            <li>Profesionálne webové stránky</li>
            <li>E-shop riešenia</li>
            <li>Digitálny marketing</li>
          </ul>
          <p>Môžeme sa stretnúť na konzultáciu?</p>
          <p>S pozdravom,<br>Domelia.sk</p>
        `,
        category: 'firmy',
        variables: ['companyName', 'contactName', 'industry'],
      },
      {
        name: 'startup-intro',
        subject: 'Domelia.sk - Rastieme spolu s vaším startupom',
        content: `
          <h2>Dobrý deň,</h2>
          <p>Som z Domelia.sk a pomáhame startupom rásť digitálne.</p>
          <p>Ponúkame:</p>
          <ul>
            <li>MVP vývoj</li>
            <li>Skalovateľné riešenia</li>
            <li>Cloud infraštruktúra</li>
          </ul>
          <p>Môžeme sa stretnúť a diskutovať o vašich plánoch?</p>
          <p>S pozdravom,<br>Domelia.sk</p>
        `,
        category: 'startup',
        variables: ['companyName', 'contactName', 'product'],
      },
    ];

    for (const template of templates) {
      try {
        await prisma.emailTemplate.create({
          data: template,
        });
      } catch (error) {
        // Template might already exist, skip
        logger.warn(`Template ${template.name} might already exist`, { error });
      }
    }

    // Seed test companies
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
        name: 'TechStart Solutions',
        website: 'https://techstart.sk',
        email: 'info@techstart.sk',
        phone: '+421 902 234 567',
        address: 'Innovation Hub, Košice',
        industry: 'Technológie',
        size: 'medium',
        description: 'Startup vyvíjajúci AI riešenia',
        contactName: 'Ing. Peter Kováč',
        contactPosition: 'CEO',
        contactEmail: 'peter.kovac@techstart.sk',
        contactPhone: '+421 902 234 568',
        status: 'PENDING',
        source: 'manual',
      },
      {
        name: 'EcoFood s.r.o.',
        website: 'https://ecofood.sk',
        email: 'info@ecofood.sk',
        phone: '+421 903 345 678',
        address: 'Eco Park 45, Žilina',
        industry: 'Potraviny',
        size: 'large',
        description: 'Výrobca organických potravín',
        contactName: 'Mgr. Anna Svobodová',
        contactPosition: 'Marketing Manager',
        contactEmail: 'anna.svobodova@ecofood.sk',
        contactPhone: '+421 903 345 679',
        status: 'PENDING',
        source: 'manual',
      },
      {
        name: 'Design Studio Creative',
        website: 'https://designcreative.sk',
        email: 'hello@designcreative.sk',
        phone: '+421 904 456 789',
        address: 'Creative District, Nitra',
        industry: 'Dizajn',
        size: 'small',
        description: 'Grafické štúdio a branding',
        contactName: 'Mgr. art. Martin Dizajnér',
        contactPosition: 'Creative Director',
        contactEmail: 'martin@designcreative.sk',
        contactPhone: '+421 904 456 790',
        status: 'PENDING',
        source: 'manual',
      },
      {
        name: 'Fitness Center Pro',
        website: 'https://fitnesspro.sk',
        email: 'info@fitnesspro.sk',
        phone: '+421 905 567 890',
        address: 'Sport Center, Trnava',
        industry: 'Šport',
        size: 'medium',
        description: 'Moderné fitness centrum',
        contactName: 'Mgr. Tomáš Fit',
        contactPosition: 'Manažér',
        contactEmail: 'tomas.fit@fitnesspro.sk',
        contactPhone: '+421 905 567 891',
        status: 'PENDING',
        source: 'manual',
      },
    ];

    for (const company of companies) {
      try {
        await prisma.company.create({
          data: company,
        });
      } catch (error) {
        // Company might already exist, skip
        logger.warn(`Company ${company.name} might already exist`, { error });
      }
    }

    // Seed agent configuration
    const configs = [
      {
        key: 'default_email_template',
        value: 'skolky-intro',
        description: 'Default email template for new contacts',
        type: 'STRING',
      },
      {
        key: 'max_companies_per_run',
        value: '5',
        description: 'Maximum companies to process per cron run',
        type: 'NUMBER',
      },
      {
        key: 'email_delay_minutes',
        value: '10',
        description: 'Delay between emails in minutes',
        type: 'NUMBER',
      },
      {
        key: 'auto_schedule_meetings',
        value: 'true',
        description: 'Automatically schedule meetings after email',
        type: 'BOOLEAN',
      },
    ];

    for (const config of configs) {
      try {
        await prisma.agentConfig.create({
          data: config,
        });
      } catch (error) {
        // Config might already exist, skip
        logger.warn(`Config ${config.key} might already exist`, { error });
      }
    }

    logger.info('Database seeding completed successfully');
  } catch (error) {
    logger.error('Database seeding failed', { error });
    throw error;
  }
};

// Import logger
import logger from '@/utils/logger.js';

// Execute seed data if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedData()
    .then(() => {
      console.log('Seed data completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed data failed:', error);
      process.exit(1);
    });
}
