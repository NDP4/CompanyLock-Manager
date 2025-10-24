#!/bin/bash

# CompanyLock Manager Setup Script
# Script ini akan membantu setup aplikasi CompanyLock Manager

set -e  # Exit on any error

echo "🚀 CompanyLock Manager Setup Script"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Docker
    if command_exists docker; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
        print_success "Docker found: $DOCKER_VERSION"
    else
        print_error "Docker not found. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    # Check Docker Compose
    if command_exists docker-compose; then
        COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)
        print_success "Docker Compose found: $COMPOSE_VERSION"
    else
        print_error "Docker Compose not found. Please install Docker Compose first."
        echo "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    # Check Python (for secrets generation)
    if command_exists python3; then
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
        print_success "Python found: $PYTHON_VERSION"
    else
        print_error "Python3 not found. Please install Python 3.7+ first."
        exit 1
    fi
    
    print_success "All prerequisites met!"
    echo ""
}

# Generate secrets
generate_secrets() {
    print_status "Generating encryption secrets..."
    
    if [ ! -d "secrets" ]; then
        mkdir -p secrets
        print_status "Created secrets directory"
    fi
    
    # Run Python script to generate secrets
    python3 generate_secrets.py
    
    print_success "Secrets generated successfully!"
    echo ""
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    # Start only MySQL first
    docker-compose up -d mysql
    
    print_status "Waiting for MySQL to be ready..."
    sleep 10
    
    # Check if MySQL is ready
    until docker-compose exec mysql mysqladmin ping -h"localhost" --silent; do
        print_status "Waiting for MySQL connection..."
        sleep 2
    done
    
    print_success "MySQL is ready!"
    echo ""
}

# Build and start all services
start_services() {
    print_status "Building and starting all services..."
    
    # Build and start all containers
    docker-compose up -d --build
    
    print_status "Waiting for all services to be ready..."
    sleep 15
    
    # Check backend health
    print_status "Checking backend health..."
    for i in {1..30}; do
        if curl -s http://localhost:8000/api/health >/dev/null 2>&1; then
            print_success "Backend is healthy!"
            break
        else
            if [ $i -eq 30 ]; then
                print_warning "Backend health check timeout. Check logs with: docker-compose logs backend"
            else
                print_status "Waiting for backend... ($i/30)"
                sleep 2
            fi
        fi
    done
    
    # Check frontend
    print_status "Checking frontend..."
    for i in {1..15}; do
        if curl -s http://localhost:3000 >/dev/null 2>&1; then
            print_success "Frontend is ready!"
            break
        else
            if [ $i -eq 15 ]; then
                print_warning "Frontend check timeout. Check logs with: docker-compose logs frontend"
            else
                print_status "Waiting for frontend... ($i/15)"
                sleep 2
            fi
        fi
    done
    
    echo ""
}

# Display final information
show_completion_info() {
    print_success "🎉 CompanyLock Manager setup completed!"
    echo ""
    echo "📍 Application URLs:"
    echo "   Frontend (Admin Panel): http://localhost:3000"
    echo "   Backend API:           http://localhost:8000"
    echo "   API Documentation:     http://localhost:8000/docs"
    echo ""
    echo "🔐 Default Admin Login:"
    echo "   Username: admin"
    echo "   Password: admin123"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT SECURITY NOTES:${NC}"
    echo "   • Change the default admin password immediately after first login"
    echo "   • Keep the secrets/ directory secure and never commit to version control"
    echo "   • Review the README.md for complete usage instructions"
    echo "   • Check DEPLOYMENT.md for production setup guidelines"
    echo ""
    echo "🛠️  Useful Commands:"
    echo "   View logs:        docker-compose logs -f"
    echo "   Stop services:    docker-compose down"
    echo "   Restart:          docker-compose restart"
    echo "   Update:           docker-compose up -d --build"
    echo ""
    echo "📊 System Status:"
    docker-compose ps
    echo ""
    print_success "Setup completed successfully! 🚀"
}

# Cleanup function
cleanup_on_error() {
    print_error "Setup failed. Cleaning up..."
    docker-compose down 2>/dev/null || true
}

# Trap cleanup on script exit
trap cleanup_on_error ERR

# Main setup process
main() {
    echo "This script will:"
    echo "1. Check prerequisites (Docker, Docker Compose, Python)"
    echo "2. Generate encryption secrets"
    echo "3. Setup MySQL database"
    echo "4. Build and start all services"
    echo "5. Verify everything is running correctly"
    echo ""
    
    read -p "Continue with setup? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Setup cancelled by user."
        exit 0
    fi
    
    echo ""
    
    # Run setup steps
    check_prerequisites
    generate_secrets
    setup_database
    start_services
    show_completion_info
}

# Check if running as root (not recommended)
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root is not recommended for security reasons."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Run main function
main