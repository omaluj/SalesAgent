#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Biz-Agent Startup Script${NC}"
echo "=================================="

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}⏳ Čakám na $service_name...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name je pripravený!${NC}"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ $service_name sa nespustil po $max_attempts pokusoch${NC}"
    return 1
}

# Create logs directory if it doesn't exist
mkdir -p logs

# Kill existing processes
echo -e "${YELLOW}🧹 Zastavujem existujúce procesy...${NC}"
pkill -f "tsx\|nodemon\|vite\|npm" 2>/dev/null || true
sleep 3

# Check if ports are free
if check_port 3001; then
    echo -e "${RED}❌ Port 3001 je obsadený${NC}"
    echo -e "${YELLOW}💡 Skúste './stop.sh' a potom './startup.sh'${NC}"
    exit 1
fi

if check_port 3000; then
    echo -e "${RED}❌ Port 3000 je obsadený${NC}"
    echo -e "${YELLOW}💡 Skúste './stop.sh' a potom './startup.sh'${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Porty sú voľné${NC}"

# Check if backend dependencies are installed
echo -e "${BLUE}🔍 Kontrolujem backend dependencies...${NC}"
if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}📦 Inštalujem backend dependencies...${NC}"
    cd backend
    npm install
    cd ..
fi

# Check if frontend dependencies are installed
echo -e "${BLUE}🔍 Kontrolujem frontend dependencies...${NC}"
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}📦 Inštalujem frontend dependencies...${NC}"
    cd frontend
    npm install
    cd ..
fi

# Generate Prisma client
echo -e "${BLUE}🔧 Generujem Prisma client...${NC}"
cd backend
npx prisma generate
cd ..

# Start backend
echo -e "${BLUE}🔧 Spúšťam backend server...${NC}"
cd backend
NODE_ENV=development ./node_modules/.bin/tsx src/api/start-server.ts > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend
if wait_for_service "http://localhost:3001/health" "Backend API"; then
    echo -e "${GREEN}✅ Backend beží (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}❌ Backend sa nespustil${NC}"
    echo "Logy:"
    tail -n 20 logs/backend.log
    echo ""
    echo -e "${YELLOW}💡 Skúste:${NC}"
    echo "  1. ./stop.sh"
    echo "  2. cd backend && npm install"
    echo "  3. npx prisma generate"
    echo "  4. ./startup.sh"
    exit 1
fi

# Start frontend
echo -e "${BLUE}🎨 Spúšťam frontend server...${NC}"
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend
if wait_for_service "http://localhost:3000" "Frontend"; then
    echo -e "${GREEN}✅ Frontend beží (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}❌ Frontend sa nespustil${NC}"
    echo "Logy:"
    tail -n 20 logs/frontend.log
    echo ""
    echo -e "${YELLOW}💡 Skúste:${NC}"
    echo "  1. ./stop.sh"
    echo "  2. cd frontend && npm install"
    echo "  3. ./startup.sh"
    exit 1
fi

# Test API endpoints
echo -e "${BLUE}🔍 Testujem API endpointy...${NC}"

# Test health endpoint
if curl -s "http://localhost:3001/health" | grep -q "ok"; then
    echo -e "${GREEN}✅ Health endpoint funguje${NC}"
else
    echo -e "${RED}❌ Health endpoint nefunguje${NC}"
fi

# Test campaigns API
if curl -s "http://localhost:3001/api/campaigns" | grep -q "success"; then
    echo -e "${GREEN}✅ Campaigns API funguje${NC}"
else
    echo -e "${RED}❌ Campaigns API nefunguje${NC}"
fi

# Test contacts API
if curl -s "http://localhost:3001/api/contacts/test" | grep -q "success"; then
    echo -e "${GREEN}✅ Contacts API funguje${NC}"
else
    echo -e "${RED}❌ Contacts API nefunguje${NC}"
fi

# Save PIDs for later use
echo $BACKEND_PID > logs/backend.pid
echo $FRONTEND_PID > logs/frontend.pid

echo ""
echo -e "${GREEN}🎉 Biz-Agent úspešne spustený!${NC}"
echo "=================================="
echo -e "${BLUE}📊 Admin Dashboard:${NC} http://localhost:3000/"
echo -e "${BLUE}📅 Verejný Kalendár:${NC} http://localhost:3000/calendar"
echo -e "${BLUE}🎯 Contact Targeting:${NC} http://localhost:3000/contacts"
echo -e "${BLUE}🎯 Campaigns + Targeting:${NC} http://localhost:3000/campaigns-targeting"
echo -e "${BLUE}🔧 Backend API:${NC} http://localhost:3001/health"
echo ""
echo -e "${YELLOW}💡 Tip: Použite './stop.sh' na zastavenie všetkých služieb${NC}"
echo -e "${YELLOW}💡 Tip: Použite './restart.sh' na reštart všetkých služieb${NC}"
echo -e "${YELLOW}💡 Tip: Použite './status.sh' na kontrolu stavu služieb${NC}"
echo ""
echo -e "${GREEN}✅ Všetky služby bežia správne!${NC}"
