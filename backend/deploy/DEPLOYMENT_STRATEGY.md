# Deployment Strategy for Maritime Trading Platform

Complete deployment strategy for a solo developer managing updates, scaling, and server migrations.

## 🏗️ Infrastructure Evolution Path

### Phase 1: AWS Lightsail (Current)

- **Size**: Small instance (1GB RAM, 1 vCPU)
- **Cost**: ~$5-10/month
- **Suitable for**: Development, testing, small user base (<100 users)

### Phase 2: Lightsail Scaling

- **Size**: Medium/Large instance (2-4GB RAM, 2 vCPU)
- **Cost**: ~$20-40/month
- **Suitable for**: Growing user base (100-1000 users)

### Phase 3: Standalone Server

- **Size**: Dedicated server or VPS
- **Cost**: Variable
- **Suitable for**: Large user base (1000+ users)

## 🚀 Deployment Workflows

### 1. Initial Deployment (Fresh Server)

```bash
# On new server
git clone your-repository
cd backend/deploy
chmod +x deploy_from_scratch.sh
sudo ./deploy_from_scratch.sh
```

**Time**: ~5-10 minutes
**Downtime**: None (new server)

### 2. Version Updates (Existing Server)

```bash
# Upload new code to server
cd backend/deploy
chmod +x update_deployment.sh
sudo ./update_deployment.sh
```

**Time**: ~2-5 minutes
**Downtime**: ~30 seconds
**Features**:

- Automatic backup before update
- Database migration
- Health checks
- Automatic rollback on failure

### 3. Server Migration (Scaling/Moving)

```bash
# On old server (export)
cd backend/deploy
chmod +x migrate_server.sh
./migrate_server.sh export

# Transfer migration file to new server
scp maritime-migration-*.tar.gz user@newserver:/tmp/

# On new server (import)
cd /tmp
./migrate_server.sh import maritime-migration-*.tar.gz
```

**Time**: ~10-15 minutes
**Downtime**: ~5-10 minutes
**Features**:

- Complete application + data migration
- Configuration preservation
- Metadata tracking

## 📋 Pre-Migration Checklist

### Before Any Deployment

- [ ] **Code tested locally**
- [ ] **Database migrations tested**
- [ ] **Backup current data**: `python export_data.py`
- [ ] **Version tagged**: Create git tag for release
- [ ] **Dependencies updated**: Check requirements.txt
- [ ] **Environment variables**: Verify .env file

### Before Server Migration

- [ ] **DNS/Domain**: Update A records to new server IP
- [ ] **SSL Certificates**: Plan certificate transfer/renewal
- [ ] **Monitoring**: Setup monitoring on new server
- [ ] **Backups**: Multiple backup copies
- [ ] **Notification**: Inform users of maintenance window

## 🔄 Update Strategy (Zero-Downtime Goals)

### Recommended: Blue-Green Deployment (Even Small Servers!)

```bash
# DEFAULT: Zero-downtime blue-green deployment
sudo ./blue_green_deployment.sh deploy
sudo ./blue_green_deployment.sh switch
```

**Why Blue-Green is preferred even on small servers:**

- Database migrations can take 15-30+ minutes
- Early development = frequent schema changes
- Single point of failure - can't afford ANY downtime
- Users expect reliability even from small apps

### Alternative: Quick Updates (CSS/JS only)

```bash
# ONLY for tiny changes with no DB migrations
sudo ./update_deployment.sh
```

### Major Updates (Breaking Schema Changes)

```bash
# Use multi-phase blue-green deployment
# 1. Phase 1: Add new schema alongside old
# 2. Phase 2: Deploy app using new schema
# 3. Phase 3: Remove old schema
```

## 📈 Scaling Strategy

### When to Scale Up

**Metrics to monitor**:

- **CPU Usage** > 80% sustained
- **Memory Usage** > 85%
- **Response Time** > 2 seconds
- **Active Users** approaching limits

### Lightsail Scaling Process

```bash
# 1. Create snapshot of current instance
# 2. Create larger instance from snapshot
# 3. Update DNS to point to new instance
# 4. Test and verify
# 5. Terminate old instance
```

### Migration to Dedicated Server

```bash
# Use our migration script
./migrate_server.sh export
# Transfer to new server
./migrate_server.sh import migration-file.tar.gz
```

## 🛡️ Backup Strategy

### Daily Automated Backups

```bash
# Add to crontab for daily exports
0 2 * * * cd /opt/maritime-trading/backend && python export_data.py && aws s3 cp data_backup/ s3://your-backup-bucket/ --recursive
```

### Pre-Deployment Backups

- Automatic backup before each update
- Stored locally: `/opt/maritime-backup-YYYYMMDD-HHMMSS/`
- Keep last 5 backups (automatic cleanup)

### Disaster Recovery

- Weekly full server snapshots (Lightsail)
- Database exports stored off-server
- Documentation of setup process

## 🔧 Monitoring & Health Checks

### Application Health

```bash
# Built into update script
curl http://localhost:8000/health
```

### System Monitoring

```bash
# Check service status
sudo systemctl status maritime-trading
sudo systemctl status postgresql
sudo systemctl status nginx

# Check logs
sudo journalctl -u maritime-trading -f
```

### Automated Alerts (Future Enhancement)

- Setup simple email alerts for service failures
- Monitor disk space, memory usage
- Database connection health

## ⚡ Quick Commands Reference

### Development Workflow

```bash
# 1. Test locally
python run.py

# 2. Create new migration (if needed)
alembic revision --autogenerate -m "description"

# 3. Tag release
git tag v1.0.1
git push origin v1.0.1

# 4. Deploy to server
rsync -av --exclude=venv --exclude=__pycache__ ./ user@server:/path/to/app/
ssh user@server "cd /path/to/app/backend/deploy && sudo ./update_deployment.sh"
```

### Emergency Procedures

```bash
# Rollback last update
cd /opt/maritime-backup-YYYYMMDD-HHMMSS/
sudo cp -r maritime-trading/* /opt/maritime-trading/
sudo systemctl restart maritime-trading

# Emergency stop
sudo systemctl stop maritime-trading

# Check what went wrong
sudo journalctl -u maritime-trading -n 100
```

## 📊 Cost & Performance Planning

### AWS Lightsail Pricing (2024)

- **$5/month**: 1GB RAM, 1 vCPU, 40GB SSD (current)
- **$10/month**: 2GB RAM, 1 vCPU, 60GB SSD
- **$20/month**: 4GB RAM, 2 vCPU, 80GB SSD
- **$40/month**: 8GB RAM, 2 vCPU, 160GB SSD

### Migration Triggers

- **Performance**: Response time > 2s consistently
- **Capacity**: >1000 concurrent users
- **Features**: Need for multiple instances, load balancing
- **Cost**: When Lightsail becomes more expensive than alternatives

## 🚨 Emergency Contacts & Procedures

### Solo Developer Checklist

- [ ] **Documentation updated** with any manual steps
- [ ] **Backup verification** - test restore process monthly
- [ ] **Monitoring setup** - basic alerts for critical failures
- [ ] **Domain/DNS backup** - access to domain registrar
- [ ] **Server access** - multiple ways to access server (SSH keys, console)

### Incident Response

1. **Identify issue** - logs, monitoring
2. **Quick fix or rollback** - use backup/rollback procedures
3. **Communicate** - if user-facing, simple status page
4. **Post-mortem** - document what happened and how to prevent

## 🔮 Future Enhancements

### Phase 1 (Next 3 months)

- [ ] Automated testing pipeline
- [ ] Basic monitoring alerts
- [ ] SSL/TLS setup
- [ ] Automated daily backups

### Phase 2 (Next 6 months)

- [ ] CI/CD pipeline with GitHub Actions
- [ ] Database connection pooling
- [ ] Redis caching layer
- [ ] Load testing and optimization

### Phase 3 (Future)

- [ ] Multi-server setup with load balancer
- [ ] Container deployment (Docker)
- [ ] Advanced monitoring (Grafana, Prometheus)
- [ ] Automated scaling
