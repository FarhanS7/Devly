#!/bin/bash

# ===========================================
# 📦 Install Dependencies for All Services
# ===========================================
# This script installs all required dependencies
# for production deployment including security packages

set -e  # Exit on error

echo "🚀 Installing dependencies for all DevConnect services..."
echo ""

# Colors for output
GREEN='\033[0.32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to install service dependencies
install_service() {
  local service_name=$1
  local service_path=$2
  
  echo -e "${YELLOW}📦 Installing dependencies for ${service_name}...${NC}"
  
  cd "$service_path"
  
  # Install base dependencies
  npm install
  
  # Install production security packages
  npm install --save helmet compression @nestjs/terminus
  npm install --save-dev @types/compression
  
  echo -e "${GREEN}✅ ${service_name} dependencies installed${NC}"
  echo ""
  
  cd - > /dev/null
}

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Install root dependencies (if any)
if [ -f "package.json" ]; then
  echo -e "${YELLOW}📦 Installing root dependencies...${NC}"
  npm install
  echo -e "${GREEN}✅ Root dependencies installed${NC}"
  echo ""
fi

# Install for each service
install_service "Core Service" "services/core-service"
install_service "Chat Service" "services/chat-service"
install_service "Projects Service" "services/projects-service"
install_service "Notification Service" "services/notification-service"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ All dependencies installed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Configure environment variables (.env files)"
echo "2. Run Prisma migrations: npm run prisma:migrate"
echo "3. Start services: docker-compose up --build"
echo ""
echo -e "For more details, see ${GREEN}DEPLOYMENT.md${NC}"
