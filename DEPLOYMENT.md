# Panduan Deployment CompanyLock Manager

## 🚀 Deployment ke Production

### 1. Persiapan Server

#### Minimum Requirements:

- **CPU**: 2 cores
- **RAM**: 4 GB
- **Storage**: 20 GB SSD
- **OS**: Ubuntu 20.04+ atau CentOS 8+
- **Docker**: 20.10+
- **Docker Compose**: 1.29+

#### Install Dependencies:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Setup SSL Certificate

#### Menggunakan Let's Encrypt:

```bash
# Install certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Certificate akan tersimpan di /etc/letsencrypt/live/your-domain.com/
```

#### Setup Auto-renewal:

```bash
# Add to crontab
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### 3. Production Configuration

#### docker-compose.prod.yml:

```yaml
version: "3.8"

services:
  mysql:
    image: mysql:8.0
    container_name: companylock_mysql_prod
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: companylock_db
      MYSQL_USER: companylock
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql_prod_data:/var/lib/mysql
    networks:
      - companylock_network
    restart: unless-stopped

  backend:
    build: ./backend
    container_name: companylock_backend_prod
    environment:
      DATABASE_URL: mysql+pymysql://companylock:${MYSQL_PASSWORD}@mysql:3306/companylock_db
      SECRET_KEY: ${SECRET_KEY}
      MASTER_KEY_FILE: /run/secrets/master_key
      TOKEN_HMAC_SECRET_FILE: /run/secrets/hmac_secret
      ALLOWED_ORIGINS: https://your-domain.com
    networks:
      - companylock_network
    secrets:
      - master_key
      - hmac_secret
    restart: unless-stopped
    depends_on:
      - mysql

  frontend:
    build: ./frontend
    container_name: companylock_frontend_prod
    networks:
      - companylock_network
    restart: unless-stopped
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    container_name: companylock_nginx_prod
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/prod.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    networks:
      - companylock_network
    restart: unless-stopped
    depends_on:
      - frontend
      - backend

volumes:
  mysql_prod_data:

networks:
  companylock_network:
    driver: bridge

secrets:
  master_key:
    file: ./secrets/master_key
  hmac_secret:
    file: ./secrets/hmac_secret
```

### 4. Environment Variables

#### .env.prod:

```bash
# Database
MYSQL_ROOT_PASSWORD=your-super-secure-root-password
MYSQL_PASSWORD=your-secure-db-password

# Backend Security
SECRET_KEY=your-super-secret-jwt-key-64-characters-minimum
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# App Settings
DEFAULT_TOKEN_DURATION=30
MAX_TOKEN_DURATION=60
```

### 5. Production Nginx Config

#### nginx/prod.conf:

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        # SSL Configuration
        ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
        ssl_prefer_server_ciphers off;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend:8000/api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### 6. Deployment Steps

```bash
# 1. Clone repository ke server
git clone <repository-url> /opt/companylock
cd /opt/companylock

# 2. Generate production secrets
python generate_secrets.py

# 3. Set proper permissions
chmod 600 secrets/*
chmod 600 .env.prod

# 4. Build dan start containers
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# 5. Verify deployment
docker-compose -f docker-compose.prod.yml ps
curl -k https://your-domain.com/api/health
```

### 7. Backup Strategy

#### Database Backup Script:

```bash
#!/bin/bash
# backup_db.sh

BACKUP_DIR="/opt/backups/companylock"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="companylock_backup_$DATE.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker exec companylock_mysql_prod mysqldump -u root -p${MYSQL_ROOT_PASSWORD} companylock_db > $BACKUP_DIR/$FILENAME

# Compress backup
gzip $BACKUP_DIR/$FILENAME

# Keep only last 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/$FILENAME.gz"
```

#### Setup Cron Job:

```bash
# Add to crontab (backup every day at 2 AM)
0 2 * * * /opt/companylock/backup_db.sh
```

### 8. Monitoring & Logging

#### Log Monitoring:

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

#### Health Monitoring Script:

```bash
#!/bin/bash
# health_check.sh

HEALTH_URL="https://your-domain.com/api/health"
LOG_FILE="/var/log/companylock_health.log"

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -eq 200 ]; then
    echo "$(date): HEALTHY - HTTP $RESPONSE" >> $LOG_FILE
else
    echo "$(date): UNHEALTHY - HTTP $RESPONSE" >> $LOG_FILE
    # Send alert (email, slack, etc.)
    echo "CompanyLock health check failed: $RESPONSE" | mail -s "Alert" admin@company.com
fi
```

### 9. Security Hardening

#### Firewall Configuration:

```bash
# UFW firewall rules
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

#### File Permissions:

```bash
# Secure sensitive files
chmod 600 secrets/*
chmod 600 .env.prod
chown root:root secrets/*

# Secure application directory
chmod 755 /opt/companylock
chown -R root:docker /opt/companylock
```

### 10. Update Procedure

#### Rolling Update:

```bash
# 1. Pull latest code
git pull origin main

# 2. Backup database
./backup_db.sh

# 3. Build new images
docker-compose -f docker-compose.prod.yml build

# 4. Rolling restart
docker-compose -f docker-compose.prod.yml up -d --no-deps backend
docker-compose -f docker-compose.prod.yml up -d --no-deps frontend

# 5. Verify deployment
curl -k https://your-domain.com/api/health
```

### 11. Disaster Recovery

#### Recovery Procedure:

```bash
# 1. Restore database from backup
gunzip /opt/backups/companylock/companylock_backup_YYYYMMDD_HHMMSS.sql.gz
docker exec -i companylock_mysql_prod mysql -u root -p${MYSQL_ROOT_PASSWORD} companylock_db < backup_file.sql

# 2. Restore secrets (from secure backup location)
cp /secure/backup/location/secrets/* ./secrets/

# 3. Restart services
docker-compose -f docker-compose.prod.yml restart
```

## 🔐 Production Security Checklist

- [ ] SSL certificate configured dan auto-renewal setup
- [ ] Default passwords semua diganti
- [ ] Firewall rules configured
- [ ] Database backup automated
- [ ] Security headers configured di Nginx
- [ ] File permissions set correctly
- [ ] Health monitoring setup
- [ ] Log monitoring configured
- [ ] Secrets stored securely
- [ ] Regular security updates scheduled

## 📞 Production Support

### Troubleshooting Commands:

```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f [service_name]

# Restart services
docker-compose -f docker-compose.prod.yml restart [service_name]

# Check resource usage
docker stats
```

### Emergency Contacts:

- **System Admin**: admin@company.com
- **Database Admin**: dba@company.com
- **Security Team**: security@company.com

---

⚠️ **PRODUCTION WARNING**: Pastikan semua konfigurasi keamanan telah diterapkan sebelum go-live. Test semua functionality di staging environment terlebih dahulu.
