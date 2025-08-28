#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Biz-Agent Stop Script${NC}"
echo "=============================="

# Kill processes by PID if files exist
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    echo -e "${YELLOW}🔄 Zastavujem backend (PID: $BACKEND_PID)...${NC}"
    kill -TERM $BACKEND_PID 2>/dev/null || true
    rm logs/backend.pid
fi

if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    echo -e "${YELLOW}🔄 Zastavujem frontend (PID: $FRONTEND_PID)...${NC}"
    kill -TERM $FRONTEND_PID 2>/dev/null || true
    rm logs/frontend.pid
fi

# Kill all related processes
echo -e "${YELLOW}🧹 Zastavujem všetky súvisiace procesy...${NC}"
pkill -f "tsx\|nodemon\|vite\|npm" 2>/dev/null || true

# Wait a moment for processes to stop
sleep 3

# Force kill if still running
pkill -9 -f "tsx\|nodemon\|vite\|npm" 2>/dev/null || true

echo -e "${GREEN}✅ Všetky služby zastavené!${NC}"
echo -e "${BLUE}💡 Použite './startup.sh' na spustenie služieb${NC}"
