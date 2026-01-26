#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}══════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  E2E Tests - Events Calendar Widget${NC}"
    echo -e "${BLUE}══════════════════════════════════════════════════${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

check_dependencies() {
    if [ ! -d "node_modules" ]; then
        print_info "Installing dependencies..."
        npm install
    fi

    if [ ! -d "$HOME/.cache/ms-playwright" ]; then
        print_info "Installing browsers..."
        npx playwright install
    fi
}

show_help() {
    echo "Usage: ./scripts/run-tests.sh [command] [options]"
    echo ""
    echo "Commands:"
    echo "  smoke         Run smoke tests (default)"
    echo "  functional    Run functional tests"
    echo "  visual        Run visual/responsive tests"
    echo "  a11y          Run accessibility tests"
    echo "  all           Run all tests"
    echo ""
    echo "  chromium      Run tests in Chrome only"
    echo "  firefox       Run tests in Firefox only"
    echo "  webkit        Run tests in Safari (WebKit)"
    echo "  mobile        Run mobile tests (Chrome + Safari)"
    echo ""
    echo "  headed        Run with visible browser"
    echo "  debug         Run in debug mode"
    echo "  ui            Run with Playwright UI"
    echo ""
    echo "  report        Open HTML report"
    echo "  cleanup       Clean reports directory"
    echo "  browsers      Run Chrome + Firefox + Mobile (no Safari)"
    echo ""
    echo "Options:"
    echo "  --headed      Add to any command for visible browser"
    echo "  --debug       Add to any command for debug mode"
    echo ""
    echo "Examples:"
    echo "  ./scripts/run-tests.sh smoke"
    echo "  ./scripts/run-tests.sh chromium --headed"
    echo "  ./scripts/run-tests.sh browsers"
}

run_browsers() {
    local chrome_status=0
    local firefox_status=0
    local mobile_status=0

    print_info "Running Chrome tests..."
    npm run test:chromium || chrome_status=$?

    print_info "Running Firefox tests..."
    npm run test:firefox || firefox_status=$?

    print_info "Running Mobile Chrome tests..."
    npx playwright test --project=mobile-chrome || mobile_status=$?

    echo ""
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}  Test Results Summary${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    
    [ $chrome_status -eq 0 ] && print_success "Chrome: PASSED" || print_error "Chrome: FAILED"
    [ $firefox_status -eq 0 ] && print_success "Firefox: PASSED" || print_error "Firefox: FAILED"
    [ $mobile_status -eq 0 ] && print_success "Mobile: PASSED" || print_error "Mobile: FAILED"

    echo ""
    print_info "Safari command: npm run test:webkit"
    print_info "View report: npm run report"

    if [ $chrome_status -eq 0 ] && [ $firefox_status -eq 0 ] && [ $mobile_status -eq 0 ]; then
        return 0
    else
        return 1
    fi
}

print_header
check_dependencies

HEADED=""
DEBUG=""

for arg in "$@"; do
    case $arg in
        --headed) HEADED="--headed" ;;
        --debug) DEBUG="--debug" ;;
    esac
done

COMMAND="${1:-smoke}"

case "$COMMAND" in
    "smoke")
        print_info "Running Smoke tests..."
        npx playwright test --grep @smoke $HEADED $DEBUG
        ;;
    "functional")
        print_info "Running Functional tests..."
        npx playwright test --grep @functional $HEADED $DEBUG
        ;;
    "visual")
        print_info "Running Visual tests..."
        npx playwright test --grep @visual $HEADED $DEBUG
        ;;
    "a11y"|"accessibility")
        print_info "Running Accessibility tests..."
        npx playwright test --grep @accessibility $HEADED $DEBUG
        ;;
    "all")
        print_info "Running all tests..."
        npm run test $HEADED $DEBUG
        ;;
    "chromium"|"chrome")
        print_info "Running Chrome tests..."
        npx playwright test --project=chromium $HEADED $DEBUG
        ;;
    "firefox")
        print_info "Running Firefox tests..."
        npx playwright test --project=firefox $HEADED $DEBUG
        ;;
    "webkit"|"safari")
        print_info "Running Safari (WebKit) tests..."
        npx playwright test --project=webkit $HEADED $DEBUG
        ;;
    "mobile")
        print_info "Running Mobile tests..."
        npm run test:mobile $HEADED $DEBUG
        ;;
    "headed")
        print_info "Running tests with visible browser..."
        npx playwright test --project=chromium --headed
        ;;
    "debug")
        print_info "Running tests in debug mode..."
        npx playwright test --project=chromium --debug
        ;;
    "ui")
        print_info "Starting Playwright UI..."
        npx playwright test --ui
        ;;
    "report")
        print_info "Opening HTML report..."
        npm run report
        ;;
    "cleanup")
        print_info "Cleaning reports..."
        npm run cleanup
        print_success "Reports cleaned"
        ;;
    "browsers")
        run_browsers
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        print_error "Unknown command: $COMMAND"
        echo ""
        show_help
        exit 1
        ;;
esac

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    print_success "Tests completed successfully"
    print_info "View report: npm run report"
else
    print_error "Tests failed"
    print_info "View report: npm run report"
    print_info "Screenshots saved in: reports/artifacts/"
fi

exit $EXIT_CODE
