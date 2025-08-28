# Biz-Agent Workspace

Automatizovaný obchodný agent pre **Domelia.sk** - Mikroservisná architektúra s React frontend a Node.js backend.

## 🏗️ Architektúra

```
Frontend (React) ←→ Backend (Express.js) ←→ Database (PostgreSQL)
                                    ↓
                              Cron Job (Node.js)
```

### **Komponenty:**
- **Backend** - Node.js API server s Express.js
- **Frontend** - React.js web interface
- **Cron Job** - Samostatný proces pre automatizáciu
- **Database** - PostgreSQL s Prisma ORM

## 🚀 Rýchly start

### **1. Inštalácia**
```bash
# Inštaluj všetky dependencies
npm run install:all
```

### **2. Nastavenie databázy**
```bash
cd backend
cp env.example env.development
docker-compose up -d postgres
npm run db:migrate
npm run db:seed
```

### **3. Spustenie**
```bash
# Spusti backend API + frontend
npm run dev

# Alebo samostatne:
npm run dev:backend    # Backend API (port 3001)
npm run dev:frontend   # Frontend (port 3000)
npm run dev:cron       # Cron job
```

## 📁 Štruktúra projektu

```
/biz-agent/
├── backend/              # Node.js Backend API Server
├── frontend/             # React.js Web Interface
├── shared/               # Shared resources
└── README.md            # Tento súbor
```

## 🔧 Vývoj

### **Backend (port 3001)**
- Express.js API server
- OAuth 2.0 pre Gmail a Calendar
- Email queue a template management
- Company discovery a scraping

### **Frontend (port 3000)**
- React.js dashboard
- Real-time monitoring
- Email template editor
- Analytics a reporting

### **Cron Job**
- Automatické spúšťanie každých 10 minút
- Company discovery pipeline
- Email sending automation

## 📚 Dokumentácia

- [Backend dokumentácia](backend/README.md)
- [Frontend dokumentácia](frontend/README.md)
- [API dokumentácia](shared/docs/API.md)
- [Deployment guide](shared/docs/DEPLOYMENT.md)

## 🛠️ Scripts

```bash
# Development
npm run dev              # Spusti backend + frontend
npm run dev:backend      # Len backend API
npm run dev:frontend     # Len frontend
npm run dev:cron         # Len cron job

# Build
npm run build            # Build backend + frontend
npm run build:backend    # Len backend
npm run build:frontend   # Len frontend

# Testing
npm run test             # Backend tests
npm run lint             # Lint všetko
npm run format           # Format všetko
```

## 🔗 API Endpoints

- `GET /health` - Health check
- `GET /api/dashboard/overview` - Dashboard metrics
- `GET /api/dashboard/pipeline-status` - Pipeline status
- `GET /api/dashboard/api-health` - API health

## 🚀 Production

```bash
# Build všetko
npm run build

# Spusti production
cd backend && npm start
```

---

**Biz-Agent** - Automatizovaný obchodný agent pre Domelia.sk
