#!/bin/bash
# Docker test runner with proper cleanup and error handling

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to cleanup on exit
cleanup() {
    echo -e "${YELLOW}Cleaning up Docker resources...${NC}"
    docker-compose down -v --remove-orphans 2>/dev/null || true
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Parse arguments
TEST_ARGS=""
BUILD_ONLY=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --build-only)
            BUILD_ONLY=true
            shift
            ;;
        *)
            TEST_ARGS="$TEST_ARGS $1"
            shift
            ;;
    esac
done

# Build Docker images
echo -e "${GREEN}Building Docker images...${NC}"
docker build -f Dockerfile -t playwright-mcp:latest . || {
    echo -e "${RED}Failed to build production Docker image${NC}"
    exit 1
}

docker build -f Dockerfile.dev -t playwright-mcp-dev:latest . || {
    echo -e "${RED}Failed to build development Docker image${NC}"
    exit 1
}

if [ "$BUILD_ONLY" = true ]; then
    echo -e "${GREEN}Build completed successfully${NC}"
    exit 0
fi

# Create test results directory
mkdir -p test-results

# Run tests
echo -e "${GREEN}Running tests in Docker...${NC}"
if [ -z "$TEST_ARGS" ]; then
    # Run all tests
    docker-compose run --rm test-runner
else
    # Run specific tests
    docker-compose run --rm test-runner npm test -- $TEST_ARGS
fi

# Check exit code
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Tests passed successfully!${NC}"
else
    echo -e "${RED}Tests failed!${NC}"
    exit 1
fi