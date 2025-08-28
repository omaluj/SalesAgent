#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 Biz-Agent Status${NC}"
echo "======================"

# Check backend
echo -e "${BLUE}🔧 Backend (Port 3001):${NC}"
if curl -s "http://localhost:3001/health" >/dev/null 2>&1; then
    echo -e "  ${GREEN}✅ Beží${NC}"
    if [ -f "logs/backend.pid" ]; then
        BACKEND_PID=$(cat logs/backend.pid)
        echo -e "  PID: $BACKEND_PID"
    fi
else
    echo -e "  ${RED}❌ Nebeží${NC}"
fi

# Check frontend
echo -e "${BLUE}🎨 Frontend (Port 3000):${NC}"
if curl -s "http://localhost:3000" >/dev/null 2>&1; then
    echo -e "  ${GREEN}✅ Beží${NC}"
    if [ -f "logs/frontend.pid" ]; then
        FRONTEND_PID=$(cat logs/frontend.pid)
        echo -e "  PID: $FRONTEND_PID"
    fi
else
    echo -e "  ${RED}❌ Nebeží${NC}"
fi

# Check API endpoints
echo -e "${BLUE}🔍 API Endpointy:${NC}"

# Public calendar API
if curl -s "http://localhost:3001/api/public/calendar/slots" | jq -e '.success' >/dev/null 2>&1; then
    echo -e "  ${GREEN}✅ Verejná API kalendára${NC}"
else
    echo -e "  ${RED}❌ Verejná API kalendára${NC}"
fi

# Admin calendar API
if curl -s "http://localhost:3001/api/calendar/settings" | jq -e '.success' >/dev/null 2>&1; then
    echo -e "  ${GREEN}✅ Admin API kalendára${NC}"
else
    echo -e "  ${RED}❌ Admin API kalendára${NC}"
fi

echo ""
echo -e "${BLUE}🌐 URL adresy:${NC}"
echo -e "  ${YELLOW}Admin Dashboard:${NC} http://localhost:3000/"
echo -e "  ${YELLOW}Verejný Kalendár:${NC} http://localhost:3000/calendar"
echo -e "  ${YELLOW}Backend API:${NC} http://localhost:3001/health"

echo ""
echo -e "${BLUE}💡 Príkazy:${NC}"
echo -e "  ${YELLOW}./startup.sh${NC} - Spustiť všetky služby"
echo -e "  ${YELLOW}./stop.sh${NC} - Zastaviť všetky služby"
echo -e "  ${YELLOW}./restart.sh${NC} - Reštart všetkých služieb"
echo -e "  ${YELLOW}./status.sh${NC} - Zobraziť stav služieb"
