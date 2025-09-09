# 🚀 Campaign Automation System

## Prehľad

Nový systém automatizácie kampane umožňuje:

1. **Automatické vyhľadávanie** nových firiem na základe kľúčových slov a lokality
2. **Automatické kontaktovanie** objavených firiem
3. **Automatické plánovanie** follow-up stretnutí
4. **Kompletné sledovanie** a analytiku výsledkov

## Architektúra

### 1. Campaign Model (Rozšírený)

```typescript
interface Campaign {
  // Základné nastavenia
  name: string;
  description: string;
  templateId: string;
  startDate: Date;
  endDate: Date;
  
  // Targeting
  targetIndustries: string[];
  targetSizes: string[];
  targetRegions: string[];
  
  // Search & Discovery
  searchKeywords: string[];        // Kľúčové slová pre Google search
  searchLocation: string;          // Lokalita (napr. "Slovakia", "Bratislava")
  maxCompaniesPerSearch: number;   // Max firiem na search (default: 10)
  searchFrequency: string;         // daily, weekly, monthly
  
  // Automation
  autoDiscover: boolean;           // Automaticky objavovať firmy
  autoContact: boolean;            // Automaticky kontaktovať
  autoSchedule: boolean;           // Automaticky plánovať stretnutia
  
  // Schedule
  sendTime: string;                // Čas odosielania (napr. "09:00")
  timezone: string;                // Časové pásmo
  maxEmailsPerDay: number;         // Max emailov za deň
}
```

### 2. Campaign Tracking

```typescript
interface CampaignTracking {
  // Discovery metrics
  companiesDiscovered: number;
  companiesContacted: number;
  companiesResponded: number;
  
  // Email metrics
  emailsSent: number;
  emailsDelivered: number;
  emailsOpened: number;
  emailsClicked: number;
  emailsBounced: number;
  
  // Lead metrics
  leadsGenerated: number;
  meetingsScheduled: number;
  meetingsCompleted: number;
  
  // Revenue
  revenueGenerated: number;
}
```

## Workflow

### 1. Vytvorenie Kampane

```typescript
const campaign = await campaignService.createCampaign({
  name: "Škôlky - Sezónna kampaň 2025",
  description: "Kampaň na prihlášky do škôlky",
  templateId: "template-id",
  startDate: new Date("2025-08-01"),
  endDate: new Date("2025-09-30"),
  
  // Search parametre
  searchKeywords: ["škôlka", "materinská škola", "predškolské vzdelávanie"],
  searchLocation: "Slovakia",
  maxCompaniesPerSearch: 15,
  searchFrequency: "daily",
  
  // Automation
  autoDiscover: true,
  autoContact: true,
  autoSchedule: true,
  
  // Schedule
  sendTime: "09:00",
  maxEmailsPerDay: 20,
});
```

### 2. Spustenie Automatizácie

```typescript
// Spustiť automatizáciu
await campaignService.updateCampaign(campaignId, {
  status: 'ACTIVE',
  isActive: true,
});
```

### 3. Automatický Pipeline

Campaign Cron Service beží každých 6 hodín a:

1. **Vyhľadáva nové firmy** na základe `searchKeywords` a `searchLocation`
2. **Kontaktuje objavené firmy** pomocou `templateId`
3. **Plánuje follow-up stretnutia** pre pozitívne odpovede
4. **Aktualizuje tracking** metriky

### 4. Sledovanie Výsledkov

```typescript
// Získať analytiku kampane
const analytics = await campaignService.getCampaignAnalytics(campaignId);

console.log(analytics.totals);
// {
//   companiesDiscovered: 45,
//   companiesContacted: 38,
//   companiesResponded: 12,
//   emailsSent: 38,
//   emailsDelivered: 35,
//   emailsOpened: 28,
//   leadsGenerated: 8,
//   meetingsScheduled: 6,
//   meetingsCompleted: 4
// }

console.log(analytics.rates);
// {
//   responseRate: 31.6,
//   openRate: 80.0,
//   leadRate: 21.1,
//   meetingRate: 75.0
// }
```

## API Endpointy

### Campaign Management

- `GET /api/campaigns` - Zoznam kampane
- `POST /api/campaigns` - Vytvoriť kampaň
- `GET /api/campaigns/:id` - Detail kampane
- `PUT /api/campaigns/:id` - Aktualizovať kampaň

### Automation

- `POST /api/campaigns/:id/start-automation` - Spustiť automatizáciu
- `POST /api/campaigns/:id/stop-automation` - Zastaviť automatizáciu

### Analytics

- `GET /api/campaigns/:id/analytics` - Analytika kampane
- `GET /api/campaigns/:id/companies` - Firmy v kampani
- `POST /api/campaigns/:id/send-emails` - Manuálne odoslať emaily

## Konfigurácia

### Campaign Cron Service

```typescript
const config = {
  enabled: true,
  schedule: '0 */6 * * *',        // Každých 6 hodín
  maxCampaignsPerRun: 5,          // Max 5 kampane na beh
  maxCompaniesPerCampaign: 10,    // Max 10 firiem na kampaň
};
```

### Environment Variables

```bash
# Campaign automation
CAMPAIGN_CRON_ENABLED=true
CAMPAIGN_CRON_SCHEDULE="0 */6 * * *"
CAMPAIGN_MAX_PER_RUN=5
CAMPAIGN_MAX_COMPANIES=10
```

## Frontend Integration

### CampaignWithTargeting Component

Nový komponent poskytuje:

- **Vytvorenie kampane** s search parametrami
- **Spustenie/zastavenie** automatizácie
- **Zobrazenie analytiky** v reálnom čase
- **Manuálne ovládanie** emailov a stretnutí

### Tlačidlá

- `🎯 Pridať kontakty` - Manuálne pridať firmy
- `👥 Firmy` - Zobraziť firmy v kampani
- `📊 Analytika` - Zobraziť metriky
- `📧 Odoslať` - Manuálne odoslať emaily
- `▶️ Spustiť` / `⏸️ Zastaviť` - Ovládanie automatizácie

## Monitoring

### Logy

Všetky akcie sa logujú s kontextom:

```typescript
logger.info('Campaign automation started', {
  campaignId: 'campaign-123',
  campaignName: 'Škôlky 2025',
  searchKeywords: ['škôlka', 'materinská škola'],
  searchLocation: 'Slovakia',
});
```

### Metriky

Sledované metriky:

- **Discovery**: Počet objavených firiem
- **Contact**: Počet kontaktovaných firiem
- **Response**: Počet odpovedí
- **Email**: Delivery, open, click rates
- **Lead**: Počet vygenerovaných leadov
- **Meeting**: Počet naplánovaných/dokončených stretnutí
- **Revenue**: Vygenerovaný príjem

## Troubleshooting

### Časté Problémy

1. **Kampaň sa nespúšťa**
   - Skontrolujte `autoDiscover`, `autoContact`, `autoSchedule` nastavenia
   - Overte, že kampaň má `status: 'ACTIVE'`

2. **Žiadne firmy sa neobjavujú**
   - Skontrolujte `searchKeywords` a `searchLocation`
   - Overte Google Search API kľúče

3. **Emaily sa neodosielajú**
   - Skontrolujte email service konfiguráciu
   - Overte `templateId` a template obsah

4. **Stretnutia sa neplánujú**
   - Skontrolujte Google Calendar integráciu
   - Overte OAuth tokeny

### Debug

```typescript
// Zapnúť debug logy
LOG_LEVEL=debug

// Manuálne spustiť pipeline
const result = await campaignCronService.executeCampaignPipeline();
console.log(result);
```

## Príklady Použitia

### 1. Škôlky Kampaň

```typescript
const skolkyCampaign = {
  name: "Škôlky - Sezónna kampaň 2025",
  searchKeywords: ["škôlka", "materinská škola", "predškolské vzdelávanie"],
  searchLocation: "Slovakia",
  targetIndustries: ["Vzdelávanie", "Škôlky"],
  targetSizes: ["small", "medium"],
  searchFrequency: "daily",
  maxCompaniesPerSearch: 15,
  autoDiscover: true,
  autoContact: true,
  autoSchedule: true,
};
```

### 2. IT Firmy Kampaň

```typescript
const itCampaign = {
  name: "IT Firmy - Web Development",
  searchKeywords: ["web development", "IT firma", "softvérová firma"],
  searchLocation: "Bratislava",
  targetIndustries: ["IT & Software"],
  targetSizes: ["medium", "large"],
  searchFrequency: "weekly",
  maxCompaniesPerSearch: 20,
  autoDiscover: true,
  autoContact: true,
  autoSchedule: true,
};
```

## Budúce Rozšírenia

1. **AI-powered targeting** - Automatické optimalizovanie search kľúčových slov
2. **A/B testing** - Testovanie rôznych template a časov odosielania
3. **Lead scoring** - Hodnotenie kvality leadov
4. **Revenue tracking** - Sledovanie príjmov z kampane
5. **Integration s CRM** - Export leadov do externých systémov
