import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createDummyData() {
  console.log('🚀 Vytváram dummy data...');

  try {
    // 1. Vytvoríme email šablóny
    console.log('📝 Vytváram email šablóny...');
    
    const templates = await Promise.all([
      // Škôlky - sezónna šablóna
      prisma.emailTemplate.create({
        data: {
          name: 'Škôlky - Sezónna kampaň',
          subject: 'Prihlášky do škôlky sú otvorené! 🎒',
          content: `
            <h2>Milí rodičia,</h2>
            <p>Nový školský rok sa blíži a my máme radosť, že vám môžeme oznámiť, že <strong>prihlášky do našej škôlky sú už otvorené!</strong></p>
            
            <h3>Prečo si vybrať našu škôlku?</h3>
            <ul>
              <li>✅ Kvalifikovaní pedagógovia</li>
              <li>✅ Moderné vybavenie a hračky</li>
              <li>✅ Bezpečné prostredie</li>
              <li>✅ Pestrý program aktivít</li>
              <li>✅ Flexibilné hodiny</li>
            </ul>
            
            <p><strong>Obmedzený počet miest!</strong> Neváhajte a prihláste svoje dieťa ešte dnes.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="mailto:info@skolka.sk" style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                📞 Kontaktujte nás
              </a>
            </div>
            
            <p>S pozdravom,<br>Tím škôlky</p>
          `,
          category: 'skolky',
          targetIndustries: ['Vzdelávanie', 'Škôlky', 'Materinské školy'],
          targetSizes: ['small', 'medium'],
          seasonalStart: '08-01',
          seasonalEnd: '06-30',
          isSeasonal: true,
          active: true,
        },
      }),

      // Upratovacie firmy
      prisma.emailTemplate.create({
        data: {
          name: 'Upratovacie firmy - Profesionálne služby',
          subject: 'Profesionálne upratovacie služby pre vašu firmu 🧽',
          content: `
            <h2>Vážený klient,</h2>
            <p>Hľadáte spoľahlivého partnera pre <strong>profesionálne upratovacie služby</strong>? My sme tu pre vás!</p>
            
            <h3>Naše služby:</h3>
            <ul>
              <li>🧽 Denné upratovanie kancelárií</li>
              <li>🏢 Hlbkové čistenie</li>
              <li>🪟 Čistenie okien a fasád</li>
              <li>🚽 Sanitárne služby</li>
              <li>🌿 Údržba exteriérov</li>
            </ul>
            
            <h3>Prečo si vybrať nás?</h3>
            <ul>
              <li>✅ 10+ rokov skúseností</li>
              <li>✅ Kvalifikovaný personál</li>
              <li>✅ Ekologické čistiace prostriedky</li>
              <li>✅ Flexibilné termíny</li>
              <li>✅ Konkurencieschopné ceny</li>
            </ul>
            
            <p><strong>Bezplatná kalkulácia!</strong> Kontaktujte nás ešte dnes.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="mailto:info@upratovanie.sk" style="background: #2196F3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                📞 Požiadajte o ponuku
              </a>
            </div>
            
            <p>S pozdravom,<br>Tím upratovacích služieb</p>
          `,
          category: 'upratovanie',
          targetIndustries: ['Upratovanie', 'Čisté služby', 'Facility Management'],
          targetSizes: ['small', 'medium', 'large'],
          isSeasonal: false,
          active: true,
        },
      }),

      // Jazykové školy
      prisma.emailTemplate.create({
        data: {
          name: 'Jazykové školy - Nový semester',
          subject: 'Začnite nový semester s novým jazykom! 🌍',
          content: `
            <h2>Milí študenti,</h2>
            <p>Nový semester sa blíži a je to <strong>perfektný čas na začatie nového jazyka</strong> alebo zlepšenie existujúcich znalostí!</p>
            
            <h3>Ponúkame kurzy:</h3>
            <ul>
              <li>🇬🇧 Angličtina (všetky úrovne)</li>
              <li>🇩🇪 Nemčina (A1-C2)</li>
              <li>🇫🇷 Francúzština (začiatočníci až pokročilí)</li>
              <li>🇪🇸 Španielčina (konverzačné kurzy)</li>
              <li>🇮🇹 Taliančina (intenzívne kurzy)</li>
            </ul>
            
            <h3>Výhody našich kurzov:</h3>
            <ul>
              <li>✅ Malé skupiny (max. 8 študentov)</li>
              <li>✅ Rodilí mluvčí</li>
              <li>✅ Moderné učebné materiály</li>
              <li>✅ Online aj offline formáty</li>
              <li>✅ Certifikáty ukončenia</li>
            </ul>
            
            <p><strong>Zľava 20% pre nových študentov!</strong> Prihláste sa do 15. septembra.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="mailto:info@jazykove-skoly.sk" style="background: #FF9800; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                📚 Prihlásiť sa na kurz
              </a>
            </div>
            
            <p>S pozdravom,<br>Tím jazykových škôl</p>
          `,
          category: 'jazykove_skoly',
          targetIndustries: ['Jazykové školy', 'E-learning', 'Vzdelávanie'],
          targetSizes: ['small', 'medium'],
          seasonalStart: '09-01',
          seasonalEnd: '01-31',
          isSeasonal: true,
          active: true,
        },
      }),

      // Reštaurácie
      prisma.emailTemplate.create({
        data: {
          name: 'Reštaurácie - Sezónne menu',
          subject: 'Nové sezónne menu je tu! 🍽️',
          content: `
            <h2>Vážení hostia,</h2>
            <p>Máme radosť, že vám môžeme predstaviť naše <strong>nové sezónne menu</strong> plné čerstvých ingrediencií a inovatívnych kombinácií!</p>
            
            <h3>Nové špeciality:</h3>
            <ul>
              <li>🥗 Čerstvé sezónne šaláty</li>
              <li>🍖 Grilované mäso s bylinkami</li>
              <li>🐟 Čerstvé ryby z lokálnych zdrojov</li>
              <li>🍝 Domáce cestoviny</li>
              <li>🍰 Sezónne dezerty</li>
            </ul>
            
            <h3>Prečo si vybrať našu reštauráciu?</h3>
            <ul>
              <li>✅ Čerstvé lokálne ingrediencie</li>
              <li>✅ Skúsený kuchársky tím</li>
              <li>✅ Príjemné prostredie</li>
              <li>✅ Pestrý výber vín</li>
              <li>✅ Flexibilné otváracie hodiny</li>
            </ul>
            
            <p><strong>Rezervácie na tel.: +421 XXX XXX XXX</strong></p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="mailto:rezervacie@restauracia.sk" style="background: #E91E63; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                📞 Rezervovať stôl
              </a>
            </div>
            
            <p>Tešíme sa na vašu návštevu!<br>Tím reštaurácie</p>
          `,
          category: 'gastronomia',
          targetIndustries: ['Reštaurácie', 'Hotely', 'Kaviarne', 'Gastronomické služby'],
          targetSizes: ['small', 'medium'],
          isSeasonal: false,
          active: true,
        },
      }),

      // Fitness
      prisma.emailTemplate.create({
        data: {
          name: 'Fitness - Nový rok, nové ciele',
          subject: 'Začnite nový rok s novými fitness cieľmi! 💪',
          content: `
            <h2>Milí fitness nadšenci,</h2>
            <p>Nový rok je tu a je to <strong>perfektný čas na stanovenie nových fitness cieľov</strong>! My vám pomôžeme ich dosiahnuť.</p>
            
            <h3>Naše služby:</h3>
            <ul>
              <li>💪 Osobné tréningy</li>
              <li>🧘 Jógové kurzy</li>
              <li>🏃‍♀️ Kardio programy</li>
              <li>🏋️‍♂️ Silové tréningy</li>
              <li>🥗 Nutričné poradenstvo</li>
            </ul>
            
            <h3>Prečo si vybrať nás?</h3>
            <ul>
              <li>✅ Kvalifikovaní tréneri</li>
              <li>✅ Moderné vybavenie</li>
              <li>✅ Flexibilné časy</li>
              <li>✅ Individuálny prístup</li>
              <li>✅ Podporné prostredie</li>
            </ul>
            
            <p><strong>Zľava 30% na prvý mesiac!</strong> Ponuka platí do konca januára.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="mailto:info@fitness.sk" style="background: #9C27B0; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                🏋️‍♀️ Začať tréning
              </a>
            </div>
            
            <p>S pozdravom,<br>Tím fitness centra</p>
          `,
          category: 'fitness_wellness',
          targetIndustries: ['Fitness', 'Wellness', 'Športové centrá', 'Jógové štúdiá'],
          targetSizes: ['small', 'medium'],
          seasonalStart: '01-01',
          seasonalEnd: '03-31',
          isSeasonal: true,
          active: true,
        },
      }),
    ]);

    console.log(`✅ Vytvorených ${templates.length} email šablón`);

    // 2. Vytvoríme kampane
    console.log('📧 Vytváram kampane...');
    
    const campaigns = await Promise.all([
      // Kampaň pre škôlky
      prisma.campaign.create({
        data: {
          name: 'Škôlky - Sezónna kampaň 2024/2025',
          description: 'Kampaň na prihlášky do škôlky pre nový školský rok',
          templateId: templates[0].id,
          startDate: new Date('2024-08-01'),
          endDate: new Date('2024-09-30'),
          maxEmailsPerDay: 50,
          targetIndustries: ['Vzdelávanie', 'Škôlky'],
          targetSizes: ['small', 'medium'],
          targetRegions: ['Bratislava', 'Košice', 'Žilina'],
          sendTime: '09:00',
          timezone: 'Europe/Bratislava',
          status: 'ACTIVE',
        },
      }),

      // Kampaň pre upratovacie firmy
      prisma.campaign.create({
        data: {
          name: 'Upratovacie služby - Q4 2024',
          description: 'Kampaň na profesionálne upratovacie služby',
          templateId: templates[1].id,
          startDate: new Date('2024-10-01'),
          endDate: new Date('2024-12-31'),
          maxEmailsPerDay: 30,
          targetIndustries: ['Upratovanie', 'Čisté služby'],
          targetSizes: ['small', 'medium', 'large'],
          targetRegions: ['Bratislava', 'Košice', 'Žilina', 'Banská Bystrica'],
          sendTime: '10:00',
          timezone: 'Europe/Bratislava',
          status: 'DRAFT',
        },
      }),

      // Kampaň pre jazykové školy
      prisma.campaign.create({
        data: {
          name: 'Jazykové školy - Zimný semester 2024',
          description: 'Kampaň na jazykové kurzy pre zimný semester',
          templateId: templates[2].id,
          startDate: new Date('2024-09-01'),
          endDate: new Date('2024-12-15'),
          maxEmailsPerDay: 40,
          targetIndustries: ['Jazykové školy', 'E-learning'],
          targetSizes: ['small', 'medium'],
          targetRegions: ['Bratislava', 'Košice'],
          sendTime: '14:00',
          timezone: 'Europe/Bratislava',
          status: 'ACTIVE',
        },
      }),
    ]);

    console.log(`✅ Vytvorených ${campaigns.length} kampaní`);

    // 3. Vytvoríme firmy (ak ešte neexistujú)
    console.log('🏢 Kontrolujem firmy...');
    
    const existingCompanies = await prisma.company.count();
    if (existingCompanies === 0) {
      console.log('📝 Vytváram firmy...');
      
      const companies = await Promise.all([
        prisma.company.create({
          data: {
            name: 'Škôlka Slniečko',
            email: 'info@skolka-slniecko.sk',
            phone: '+421 2 1234 5678',
            website: 'https://skolka-slniecko.sk',
            industry: 'Vzdelávanie',
            size: 'small',
            region: 'Bratislava',
            status: 'ACTIVE',
          },
        }),
        prisma.company.create({
          data: {
            name: 'CleanPro Services',
            email: 'info@cleanpro.sk',
            phone: '+421 2 2345 6789',
            website: 'https://cleanpro.sk',
            industry: 'Upratovanie',
            size: 'medium',
            region: 'Košice',
            status: 'ACTIVE',
          },
        }),
        prisma.company.create({
          data: {
            name: 'Language Academy',
            email: 'info@language-academy.sk',
            phone: '+421 2 3456 7890',
            website: 'https://language-academy.sk',
            industry: 'Jazykové školy',
            size: 'small',
            region: 'Žilina',
            status: 'ACTIVE',
          },
        }),
        prisma.company.create({
          data: {
            name: 'Restaurant U Zlatého Kohúta',
            email: 'info@zlaty-kohut.sk',
            phone: '+421 2 4567 8901',
            website: 'https://zlaty-kohut.sk',
            industry: 'Reštaurácie',
            size: 'medium',
            region: 'Bratislava',
            status: 'ACTIVE',
          },
        }),
        prisma.company.create({
          data: {
            name: 'FitZone Gym',
            email: 'info@fitzone.sk',
            phone: '+421 2 5678 9012',
            website: 'https://fitzone.sk',
            industry: 'Fitness',
            size: 'large',
            region: 'Košice',
            status: 'ACTIVE',
          },
        }),
      ]);

      console.log(`✅ Vytvorených ${companies.length} firiem`);

      // 4. Priradíme firmy ku kampaniam
      console.log('🔗 Pridávam firmy ku kampaniam...');
      
      await Promise.all([
        // Firma 1 ku kampani 1
        prisma.campaignCompany.create({
          data: {
            campaignId: campaigns[0].id,
            companyId: companies[0].id,
            status: 'ASSIGNED',
          },
        }),
        // Firma 2 ku kampani 2
        prisma.campaignCompany.create({
          data: {
            campaignId: campaigns[1].id,
            companyId: companies[1].id,
            status: 'ASSIGNED',
          },
        }),
        // Firma 3 ku kampani 3
        prisma.campaignCompany.create({
          data: {
            campaignId: campaigns[2].id,
            companyId: companies[2].id,
            status: 'ASSIGNED',
          },
        }),
      ]);

      console.log('✅ Firmy priradené ku kampaniam');
    } else {
      console.log(`✅ Firma už existujú (${existingCompanies} firiem)`);
    }

    console.log('🎉 Dummy data úspešne vytvorené!');
    console.log('\n📊 Súhrn:');
    console.log(`- Email šablóny: ${templates.length}`);
    console.log(`- Kampane: ${campaigns.length}`);
    console.log(`- Firmy: ${existingCompanies > 0 ? existingCompanies : '5 (nové)'}`);

  } catch (error) {
    console.error('❌ Chyba pri vytváraní dummy dát:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDummyData();
