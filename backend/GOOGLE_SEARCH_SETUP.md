# 🔍 **Google Custom Search Engine Setup**

## **Krok 1: Vytvorenie Custom Search Engine**

1. Choďte na [Google Programmable Search Engine](https://programmablesearchengine.google.com)
2. Prihláste sa s rovnakým Google účtom ako v Cloud Console
3. Kliknite **"Create a search engine"**

## **Krok 2: Konfigurácia Search Engine**

### Základné nastavenia:
- **Sites to search**: `www.google.com` (pre celý web)
- **Name**: `Biz-Agent Company Search`
- **Language**: `Slovak`
- **Search the entire web**: ✅ **ZAPNUTÉ**

### Pokročilé nastavenia:
- **Search only included sites**: ❌ **VYPNUTÉ**
- **Image search**: ✅ **ZAPNUTÉ**
- **SafeSearch**: `Active`

## **Krok 3: Získanie Search Engine ID**

1. Po vytvorení choďte do **"Setup"** sekcie
2. Skopírujte **"Search engine ID"** (cx parameter)
3. Vyzerá ako: `012345678901234567890:abcdefghijk`

## **Krok 4: Testovanie Search Engine**

1. V **"Test"** sekcii môžete otestovať vyhľadávanie
2. Skúste vyhľadávanie: `IT companies Slovakia`

## **Krok 5: Nastavenie v .env**

```bash
GOOGLE_SEARCH_ENGINE_ID="váš_search_engine_id"
```

## **Príklad vyhľadávania:**

```typescript
// Hľadanie IT firiem na Slovensku
const results = await googleSearchService.searchCompanies(
  'IT companies', 
  'technology', 
  'Slovakia'
);

// Hľadanie marketingových agentúr
const results = await googleSearchService.searchCompanies(
  'marketing agencies', 
  'marketing', 
  'Bratislava'
);
```

## **Rate Limits:**
- **Zadarmo**: 100 requests/deň
- **Platené**: 10,000 requests/deň ($5/1000 requests)

## **Tipy:**
- Používajte špecifické kľúčové slová pre lepšie výsledky
- Kombinujte s lokáciami (Bratislava, Košice, atď.)
- Testujte rôzne odvetvia (IT, marketing, stavebníctvo, atď.)
