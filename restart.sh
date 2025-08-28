#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Biz-Agent Restart Script${NC}"
echo "================================="

# Stop all services
echo -e "${YELLOW}🛑 Zastavujem služby...${NC}"
./stop.sh

# Wait a moment
sleep 2

# Start all services
echo -e "${YELLOW}🚀 Spúšťam služby...${NC}"
./startup.sh
