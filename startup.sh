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

# Kill existing processes
echo -e "${YELLOW}🧹 Zastavujem existujúce procesy...${NC}"
pkill -f "tsx\|nodemon\|vite\|npm" 2>/dev/null || true
sleep 2

# Check if ports are free
if check_port 3001; then
    echo -e "${RED}❌ Port 3001 je obsadený${NC}"
    exit 1
fi

if check_port 3000; then
    echo -e "${RED}❌ Port 3000 je obsadený${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Porty sú voľné${NC}"

# Start backend
echo -e "${BLUE}🔧 Spúšťam backend server...${NC}"
cd backend
NODE_ENV=development npx tsx src/api/start-server.ts > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend
if wait_for_service "http://localhost:3001/health" "Backend API"; then
    echo -e "${GREEN}✅ Backend beží (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}❌ Backend sa nespustil${NC}"
    echo "Logy:"
    tail -n 20 logs/backend.log
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
    exit 1
fi

# Test API endpoints
echo -e "${BLUE}🔍 Testujem API endpointy...${NC}"

# Test public calendar API
if curl -s "http://localhost:3001/api/public/calendar/slots" | jq -e '.success' >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Verejná API kalendára funguje${NC}"
else
    echo -e "${RED}❌ Verejná API kalendára nefunguje${NC}"
fi

# Test admin calendar API
if curl -s "http://localhost:3001/api/calendar/settings" | jq -e '.success' >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Admin API kalendára funguje${NC}"
else
    echo -e "${RED}❌ Admin API kalendára nefunguje${NC}"
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Save PIDs for later use
echo $BACKEND_PID > logs/backend.pid
echo $FRONTEND_PID > logs/frontend.pid

echo ""
echo -e "${GREEN}🎉 Biz-Agent úspešne spustený!${NC}"
echo "=================================="
echo -e "${BLUE}📊 Admin Dashboard:${NC} http://localhost:3000/"
echo -e "${BLUE}📅 Verejný Kalendár:${NC} http://localhost:3000/calendar"
echo -e "${BLUE}🔧 Backend API:${NC} http://localhost:3001/health"
echo ""
echo -e "${YELLOW}💡 Tip: Použite './stop.sh' na zastavenie všetkých služieb${NC}"
echo -e "${YELLOW}💡 Tip: Použite './restart.sh' na reštart všetkých služieb${NC}"
echo ""
echo -e "${GREEN}✅ Všetky služby bežia správne!${NC}"
