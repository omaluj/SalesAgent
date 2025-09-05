import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

export const seedEnhancedTemplates = async (): Promise<void> => {
  try {
    logger.info('Starting enhanced template seeding...');

    // Enhanced email templates with targeting and seasonal settings
    const templates = [
      {
        name: 'skolky-sezonna',
        subject: 'Domelia.sk - Školský rok 2025/2026 - Digitálne riešenia pre vašu škôlku',
        content: `
          <h2>Dobrý deň {{contactName}},</h2>
          <p>Školský rok sa blíži a my v Domelia.sk máme pripravené digitálne riešenia pre vašu škôlku {{companyName}}.</p>
          
          <h3>Prečo práve teraz?</h3>
          <ul>
            <li>🎯 <strong>August-September:</strong> Najlepší čas na implementáciu</li>
            <li>📱 <strong>Rodičia očakávajú:</strong> Moderné komunikácie</li>
            <li>💻 <strong>Konkurencia:</strong> Zostaňte krok vpred</li>
          </ul>
          
          <h3>Naše riešenia pre školské zariadenia:</h3>
          <ul>
            <li>🌐 <strong>Webové stránky:</strong> Profesionálne, responzívne, SEO optimalizované</li>
            <li>📧 <strong>Komunikácia s rodičmi:</strong> Email newsletter, SMS notifikácie</li>
            <li>📝 <strong>Online registrácie:</strong> Zjednodušte administratívu</li>
            <li>📊 <strong>Dashboard pre rodičov:</strong> Sledovanie pokroku dieťaťa</li>
          </ul>
          
          <p><strong>Špeciálna ponuka pre školský rok 2025/2026:</strong></p>
          <ul>
            <li>✅ 20% zľava pri objednávke do 15.9.2025</li>
            <li>✅ Bezplatná konzultácia a analýza</li>
            <li>✅ Implementácia do 2 týždňov</li>
          </ul>
          
          <p>Môžeme sa stretnúť na bezplatnú konzultáciu už tento týždeň?</p>
          
          <p>S pozdravom,<br>
          <strong>Domelia.sk</strong><br>
          Digitálne riešenia pre školské zariadenia</p>
        `,
        category: 'skolky',
        targetIndustries: ['Vzdelávanie', 'Škôlky', 'Materinské školy'],
        targetSizes: ['small', 'medium'],
        seasonalStart: '08-01',
        seasonalEnd: '06-30',
        isSeasonal: true,
        variables: ['companyName', 'contactName', 'industry'],
      },
      {
        name: 'upratovacie-firmy',
        subject: 'Domelia.sk - Profesionálny web pre vašu upratovaciu firmu',
        content: `
          <h2>Dobrý deň {{contactName}},</h2>
          <p>Vidím, že vediete upratovaciu firmu {{companyName}} a chcete rásť.</p>
          
          <h3>Prečo potrebujete profesionálny web?</h3>
          <ul>
            <li>🏢 <strong>Dôveryhodnosť:</strong> Zákazníci si vyberajú firmy s webom</li>
            <li>📱 <strong>Online objednávky:</strong> 24/7 dostupnosť pre zákazníkov</li>
            <li>📊 <strong>Referencie:</strong> Ukážte svoju prácu a spokojných zákazníkov</li>
            <li>💼 <strong>Profesionalita:</strong> Vylepšite svoju image na trhu</li>
          </ul>
          
          <h3>Naše riešenia pre upratovacie firmy:</h3>
          <ul>
            <li>🌐 <strong>Webové stránky:</strong> Moderné, responzívne, rýchle</li>
            <li>📋 <strong>Online objednávky:</strong> Jednoduchý systém rezervácií</li>
            <li>📱 <strong>Mobilná aplikácia:</strong> Pre vašich zamestnancov</li>
            <li>📊 <strong>Analytics:</strong> Sledujte objednávky a ziskovosť</li>
          </ul>
          
          <p><strong>Špeciálna ponuka pre upratovacie firmy:</strong></p>
          <ul>
            <li>✅ Bezplatná konzultácia a analýza</li>
            <li>✅ Implementácia do 3 týždňov</li>
            <li>✅ Školení pre vašich zamestnancov</li>
          </ul>
          
          <p>Môžeme sa stretnúť a diskutovať o vašich potrebách?</p>
          
          <p>S pozdravom,<br>
          <strong>Domelia.sk</strong><br>
          Digitálne riešenia pre upratovacie firmy</p>
        `,
        category: 'upratovanie',
        targetIndustries: ['Upratovanie', 'Čisté služby', 'Facility Management'],
        targetSizes: ['small', 'medium', 'large'],
        isSeasonal: false,
        variables: ['companyName', 'contactName', 'industry', 'size'],
      },
      {
        name: 'jazykove-skoly',
        subject: 'Domelia.sk - Moderný web pre vašu jazykovú školu',
        content: `
          <h2>Dobrý deň {{contactName}},</h2>
          <p>Jazykové vzdelávanie je vždy aktuálne a my v Domelia.sk máme riešenia pre vašu jazykovú školu {{companyName}}.</p>
          
          <h3>Prečo moderný web pre jazykovú školu?</h3>
          <ul>
            <li>🌍 <strong>Medzinárodné publikum:</strong> Cielte na študentov z celého sveta</li>
            <li>📚 <strong>Online kurzy:</strong> Rozšírte svoju ponuku o e-learning</li>
            <li>📱 <strong>Mobilní študenti:</strong> 70% používateľov je na mobile</li>
            <li>💳 <strong>Online platby:</strong> Zjednodušte registráciu do kurzov</li>
          </ul>
          
          <h3>Naše riešenia pre jazykové školy:</h3>
          <ul>
            <li>🌐 <strong>Webové stránky:</strong> Viacjazyčné, moderné, responzívne</li>
            <li>📚 <strong>E-learning platforma:</strong> Online kurzy a testy</li>
            <li>📅 <strong>Rezervačný systém:</strong> Pre individuálne hodiny</li>
            <li>📊 <strong>Študentský dashboard:</strong> Sledovanie pokroku</li>
          </ul>
          
          <p><strong>Špeciálna ponuka pre jazykové školy:</strong></p>
          <ul>
            <li>✅ Bezplatná konzultácia a analýza</li>
            <li>✅ Implementácia do 4 týždňov</li>
            <li>✅ Školení pre vašich lektorov</li>
            <li>✅ 6 mesiacov podpory zdarma</li>
          </ul>
          
          <p>Môžeme sa stretnúť a diskutovať o vašich potrebách?</p>
          
          <p>S pozdravom,<br>
          <strong>Domelia.sk</strong><br>
          Digitálne riešenia pre jazykové školy</p>
        `,
        category: 'jazykove_skoly',
        targetIndustries: ['Vzdelávanie', 'Jazykové školy', 'E-learning'],
        targetSizes: ['small', 'medium'],
        isSeasonal: false,
        variables: ['companyName', 'contactName', 'industry', 'size'],
      },
      {
        name: 'restauracie-hotely',
        subject: 'Domelia.sk - Digitálne riešenia pre vašu reštauráciu/hotel',
        content: `
          <h2>Dobrý deň {{contactName}},</h2>
          <p>Hospodársky sektor sa digitálizuje a my v Domelia.sk máme riešenia pre vašu reštauráciu/hotel {{companyName}}.</p>
          
          <h3>Prečo digitálne riešenia pre gastronomiu?</h3>
          <ul>
            <li>🍽️ <strong>Online objednávky:</strong> Zvýšte tržby o 30%</li>
            <li>📱 <strong>Mobilní zákazníci:</strong> 80% objednávok je z mobilu</li>
            <li>🌟 <strong>Hodnotenia a recenzie:</strong> Zlepšite svoju reputáciu</li>
            <li>💳 <strong>Online platby:</strong> Zjednodušte proces objednávania</li>
          </ul>
          
          <h3>Naše riešenia pre gastronomiu:</h3>
          <ul>
            <li>🌐 <strong>Webové stránky:</strong> Atraktívne, responzívne, rýchle</li>
            <li>📱 <strong>Online objednávky:</strong> Jednoduchý systém pre zákazníkov</li>
            <li>📊 <strong>Rezervačný systém:</strong> Pre stoly a udalosti</li>
            <li>📈 <strong>Analytics:</strong> Sledujte objednávky a preferencie</li>
          </ul>
          
          <p><strong>Špeciálna ponuka pre gastronomiu:</strong></p>
          <ul>
            <li>✅ Bezplatná konzultácia a analýza</li>
            <li>✅ Implementácia do 3 týždňov</li>
            <li>✅ Školení pre vašich zamestnancov</li>
            <li>✅ Integrácia s existujúcimi systémami</li>
          </ul>
          
          <p>Môžeme sa stretnúť a diskutovať o vašich potrebách?</p>
          
          <p>S pozdravom,<br>
          <strong>Domelia.sk</strong><br>
          Digitálne riešenia pre gastronomiu</p>
        `,
        category: 'gastronomia',
        targetIndustries: ['Reštaurácie', 'Hotely', 'Kaviarne', 'Gastronomické služby'],
        targetSizes: ['small', 'medium', 'large'],
        isSeasonal: false,
        variables: ['companyName', 'contactName', 'industry', 'size'],
      },
      {
        name: 'fitness-wellness',
        subject: 'Domelia.sk - Digitálne riešenia pre vaše fitness/wellness centrum',
        content: `
          <h2>Dobrý deň {{contactName}},</h2>
          <p>Fitness a wellness saktor rastie a my v Domelia.sk máme riešenia pre vaše centrum {{companyName}}.</p>
          
          <h3>Prečo digitálne riešenia pre fitness?</h3>
          <ul>
            <li>💪 <strong>Online členstvo:</strong> Zvýšte počet členov</li>
            <li>📱 <strong>Mobilná aplikácia:</strong> Zlepšite zážitok členov</li>
            <li>📊 <strong>Sledovanie pokroku:</strong> Motivujte členov k pravidelným návštevám</li>
            <li>🎯 <strong>Personalizácia:</strong> Individuálne tréningové plány</li>
          </ul>
          
          <h3>Naše riešenia pre fitness centrá:</h3>
          <ul>
            <li>🌐 <strong>Webové stránky:</strong> Moderné, atraktívne, responzívne</li>
            <li>📱 <strong>Mobilná aplikácia:</strong> Pre členov a trénerov</li>
            <li>📅 <strong>Rezervačný systém:</strong> Pre skupinové hodiny</li>
            <li>📊 <strong>Členský dashboard:</strong> Sledovanie pokroku a rezervácií</li>
          </ul>
          
          <p><strong>Špeciálna ponuka pre fitness centrá:</strong></p>
          <ul>
            <li>✅ Bezplatná konzultácia a analýza</li>
            <li>✅ Implementácia do 4 týždňov</li>
            <li>✅ Školení pre vašich trénerov</li>
            <li>✅ Integrácia s fitness trackerami</li>
          </ul>
          
          <p>Môžeme sa stretnúť a diskutovať o vašich potrebách?</p>
          
          <p>S pozdravom,<br>
          <strong>Domelia.sk</strong><br>
          Digitálne riešenia pre fitness a wellness</p>
        `,
        category: 'fitness_wellness',
        targetIndustries: ['Fitness', 'Wellness', 'Športové centrá', 'Jógové štúdiá'],
        targetSizes: ['small', 'medium'],
        isSeasonal: false,
        variables: ['companyName', 'contactName', 'industry', 'size'],
      },
    ];

    for (const template of templates) {
      try {
        await prisma.emailTemplate.create({
          data: template,
        });
        logger.info(`Enhanced template ${template.name} created successfully`);
      } catch (error) {
        // Template might already exist, skip
        logger.warn(`Enhanced template ${template.name} might already exist`, { error });
      }
    }

    logger.info('Enhanced template seeding completed successfully');
  } catch (error) {
    logger.error('Failed to seed enhanced templates', { error });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedEnhancedTemplates()
    .then(() => {
      logger.info('Enhanced template seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Enhanced template seeding failed', { error });
      process.exit(1);
    });
}
