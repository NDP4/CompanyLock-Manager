# Development Tools untuk CompanyLock Manager

## Quick Setup (Development)

```bash
# 1. Setup dengan script otomatis
chmod +x setup.sh
./setup.sh

# 2. Manual setup (jika script gagal)
python3 generate_secrets.py
docker-compose up -d --build
```

## Development Commands

### Backend Development

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev  # http://localhost:5173
```

### Database Operations

```bash
# Reset database
docker-compose down -v
docker-compose up -d mysql
docker-compose exec backend python migrate_and_seed.py

# Backup database
docker-compose exec mysql mysqldump -u companylock -p YOUR_PASSWORD companylock_db > backup.sql

# Restore database
docker-compose exec -i mysql mysql -u companylock -p YOUR_PASSWORD companylock_db < backup.sql
```

### Docker Operations

```bash
# Build specific service
docker-compose build backend
docker-compose build frontend

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql

# Restart specific service
docker-compose restart backend

# Shell access
docker-compose exec backend bash
docker-compose exec mysql mysql -u companylock -p YOUR_PASSWORD companylock_db
```

## Testing

### API Testing dengan curl

```bash
# Health check
curl http://localhost:8000/api/health

# Login admin
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Get users (dengan token)
curl http://localhost:8000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Frontend Testing

```bash
cd frontend
npm test              # Run unit tests
npm run test:e2e      # Run e2e tests (jika ada)
npm run lint          # Check code style
npm run build         # Test build process
```

## Database Schema

### Users Table

```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    department VARCHAR(50) NOT NULL,
    role ENUM('Admin', 'User') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    encrypted_password TEXT NOT NULL,
    password_hash VARCHAR(255),
    must_change_password BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Access Tokens Table

```sql
CREATE TABLE access_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    token_string VARCHAR(255) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    admin_id INT NOT NULL,
    duration_minutes INT NOT NULL,
    status ENUM('active', 'used', 'expired') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    client_host VARCHAR(45)
);
```

### Audit Logs Table

```sql
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    action ENUM('login', 'logout', 'password_change', 'token_generated', 'token_used', 'password_viewed', 'user_imported', 'user_created', 'user_updated', 'user_deleted') NOT NULL,
    admin_id INT,
    target_user_id INT,
    details TEXT,
    client_host VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints Reference

### Authentication

| Method | Endpoint                    | Description           | Auth Required |
| ------ | --------------------------- | --------------------- | ------------- |
| POST   | `/api/auth/login`           | Admin login           | No            |
| POST   | `/api/auth/change-password` | Change admin password | Yes           |

### User Management

| Method | Endpoint          | Description      | Auth Required |
| ------ | ----------------- | ---------------- | ------------- |
| GET    | `/api/users`      | Get all users    | Yes           |
| GET    | `/api/users/{id}` | Get user details | Yes           |

### Token Management

| Method | Endpoint               | Description                | Auth Required |
| ------ | ---------------------- | -------------------------- | ------------- |
| POST   | `/api/tokens/generate` | Generate access token      | Yes           |
| POST   | `/api/tokens/use`      | Use token to view password | No            |

### CSV Operations

| Method | Endpoint            | Description           | Auth Required |
| ------ | ------------------- | --------------------- | ------------- |
| GET    | `/api/csv/template` | Download CSV template | Yes           |
| POST   | `/api/csv/import`   | Import users from CSV | Yes           |

### System

| Method | Endpoint          | Description         | Auth Required |
| ------ | ----------------- | ------------------- | ------------- |
| GET    | `/api/health`     | System health check | No            |
| GET    | `/api/audit-logs` | Get audit logs      | Yes           |

## Environment Variables

### Backend (.env)

```bash
# Database
DATABASE_URL=mysql+pymysql://companylock:YOUR_PASSWORD@localhost:3306/companylock_db

# Security
SECRET_KEY=your-jwt-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Encryption
MASTER_KEY=base64-encoded-master-key
TOKEN_HMAC_SECRET=base64-encoded-hmac-secret

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# App Settings
DEFAULT_TOKEN_DURATION=30
MAX_TOKEN_DURATION=60
```

### Frontend (vite config)

```javascript
export default defineConfig({
  server: {
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
});
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

```bash
# Check if MySQL is running
docker-compose ps mysql

# Check MySQL logs
docker-compose logs mysql

# Restart MySQL
docker-compose restart mysql
```

#### 2. Backend Import Errors

```bash
# Check Python dependencies
docker-compose exec backend pip list

# Reinstall dependencies
docker-compose exec backend pip install -r requirements.txt

# Check Python path
docker-compose exec backend python -c "import sys; print(sys.path)"
```

#### 3. Frontend Build Errors

```bash
# Clear node_modules
cd frontend
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Should be 16+
```

#### 4. Secrets Not Found

```bash
# Regenerate secrets
python3 generate_secrets.py

# Check file permissions
ls -la secrets/
chmod 600 secrets/*
```

#### 5. CORS Errors

```bash
# Check ALLOWED_ORIGINS in backend/.env
# Make sure frontend URL is included
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Performance Tuning

#### MySQL Optimization

```sql
-- Add these to MySQL config for better performance
SET GLOBAL innodb_buffer_pool_size = 256M;
SET GLOBAL max_connections = 200;
SET GLOBAL query_cache_size = 64M;
```

#### Backend Optimization

```python
# Use connection pooling in production
engine = create_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True,
    pool_recycle=3600
)
```

## Development Workflow

1. **Feature Development**

   ```bash
   git checkout -b feature/new-feature
   # Make changes
   docker-compose up -d --build  # Test locally
   git commit -m "Add new feature"
   git push origin feature/new-feature
   ```

2. **Testing**

   ```bash
   # Test backend
   cd backend && python -m pytest

   # Test frontend
   cd frontend && npm test
   ```

3. **Deployment**
   ```bash
   git checkout main
   git pull origin main
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

## Security Checklist

- [ ] Change default admin password
- [ ] Set strong SECRET_KEY
- [ ] Use HTTPS in production
- [ ] Set proper file permissions on secrets
- [ ] Enable firewall
- [ ] Regular security updates
- [ ] Monitor audit logs
- [ ] Backup encryption keys securely
