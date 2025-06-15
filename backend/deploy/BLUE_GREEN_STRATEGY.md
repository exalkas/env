# Blue-Green Deployment Strategy

Complete guide to implementing zero-downtime deployments using blue-green methodology.

## 🎯 What is Blue-Green Deployment?

Blue-green deployment is a technique that reduces downtime and risk by running two identical production environments called **Blue** and **Green**.

- **Blue**: Currently live environment serving users
- **Green**: Inactive environment for deploying new versions
- **Switch**: Instant traffic routing from Blue to Green
- **Zero Downtime**: Users never experience service interruption

## 🏗️ Architecture Overview

### Single Server Setup (Lightsail Phase)

```
Internet → Nginx (Port 80) → Blue Environment (Port 8000) ✅ ACTIVE
                          → Green Environment (Port 8001) ⏸️ INACTIVE

Directories:
/opt/maritime-trading-blue/    ← Blue environment
/opt/maritime-trading-green/   ← Green environment
/opt/maritime-trading/         ← Symlink to active environment
```

### Multi-Server Setup (Future Scaling)

```
Internet → Load Balancer → Blue Server ✅ ACTIVE
                        → Green Server ⏸️ INACTIVE
```

## 🚀 Deployment Workflow

### Step-by-Step Blue-Green Deployment

```bash
# 1. Check current status
./blue_green_deployment.sh status

# 2. Deploy new version to inactive environment
./blue_green_deployment.sh deploy /path/to/new/code

# 3. Test new version thoroughly
curl http://localhost:8001/health  # If Green is inactive
# Test all endpoints, run smoke tests

# 4. Switch traffic to new version (ZERO DOWNTIME)
./blue_green_deployment.sh switch

# 5. Monitor new version
./blue_green_deployment.sh status

# 6. Clean up old environment (optional)
./blue_green_deployment.sh cleanup
```

### Rollback Process (if issues detected)

```bash
# Instant rollback to previous version
./blue_green_deployment.sh rollback
```

## 📊 Comparison: Blue-Green vs Other Methods

| Feature                   | Blue-Green   | Rolling Update | Update Script |
| ------------------------- | ------------ | -------------- | ------------- |
| **Downtime**              | Zero         | Minimal        | 30-60 seconds |
| **Rollback Speed**        | Instant      | Slow           | Manual        |
| **Resource Usage**        | 2x           | 1x             | 1x            |
| **Testing Before Switch** | Full testing | Limited        | None          |
| **Risk Level**            | Very Low     | Medium         | High          |
| **Complexity**            | Medium       | High           | Low           |

## 🎭 When to Use Each Method

### Use Blue-Green When:

- **Zero downtime** is critical
- You have sufficient server resources (2x)
- **Database changes** are backward compatible
- **Critical production** environment
- Need thorough testing before going live

### Use Regular Update When:

- Resource constraints (small server)
- **Simple code-only** changes
- **Development/staging** environments
- Database schema changes required

### Use Server Migration When:

- Moving between servers
- **Major infrastructure** changes
- **Scaling up/down** server size

## 💡 Implementation Strategies

### Phase 1: Lightsail Small (Resource-Limited) - **BLUE-GREEN PREFERRED**

```bash
# DEFAULT: Use blue-green for all deployments (especially important for small servers!)
sudo ./blue_green_deployment.sh deploy

# EXCEPTION: Use regular updates only for tiny code-only changes
sudo ./update_deployment.sh  # Only for CSS/JS tweaks, no DB changes
```

**Why Blue-Green is MORE important on small servers:**

- Database migrations take longer and are riskier
- Single point of failure - can't afford downtime
- Early stage = frequent schema changes
- Limited resources make recovery harder

### Phase 2: Lightsail Medium+ (More Resources)

```bash
# Continue with blue-green for all deployments
sudo ./blue_green_deployment.sh deploy
```

### Phase 3: Multi-Server (Full Blue-Green)

```bash
# True blue-green with separate servers
# Load balancer switches between server pools
```

## 🔧 Technical Implementation Details

### Port Management

- **Blue Environment**: Port 8000
- **Green Environment**: Port 8001
- **Nginx**: Routes traffic based on configuration

### Database Handling

- **Shared Database**: Both environments use same database
- **Migration Strategy**: Backward-compatible migrations
- **Data Consistency**: Database changes applied during deployment

### Service Management

```bash
# Blue environment service
sudo systemctl status maritime-trading-blue

# Green environment service
sudo systemctl status maritime-trading-green
```

### Nginx Configuration Switching

```bash
# Current configuration points to active environment
proxy_pass http://127.0.0.1:8000;  # Blue active
# Switched to:
proxy_pass http://127.0.0.1:8001;  # Green active
```

## 🛡️ Safety Features

### Pre-Deployment Checks

- ✅ Inactive environment health
- ✅ Database connectivity
- ✅ Dependencies installation
- ✅ Configuration validation

### Post-Switch Verification

- ✅ HTTP health check
- ✅ Database connectivity
- ✅ Critical endpoints
- ✅ Response time monitoring

### Automatic Rollback Triggers

- ❌ Health check failure
- ❌ Service startup failure
- ❌ Database connection issues

## 📋 Best Practices

### Before Deployment

1. **Test migrations** on copy of production data
2. **Verify backward compatibility** of database changes
3. **Run integration tests** locally
4. **Check resource usage** (disk space, memory)

### During Deployment

1. **Monitor logs** during deployment
2. **Test thoroughly** before switching
3. **Verify all endpoints** work correctly
4. **Check performance** metrics

### After Deployment

1. **Monitor error rates** for 10-15 minutes
2. **Check response times** and performance
3. **Verify background jobs** are working
4. **Keep old environment** running for quick rollback

## 🚨 Troubleshooting

### Common Issues

#### Environment Won't Start

```bash
# Check logs
sudo journalctl -u maritime-trading-green -n 50

# Check port conflicts
sudo lsof -i :8001

# Verify permissions
sudo chown -R maritime:maritime /opt/maritime-trading-green
```

#### Switch Fails

```bash
# Verify nginx config
sudo nginx -t

# Check environment health
curl http://localhost:8001/health

# Manual nginx reload
sudo systemctl reload nginx
```

#### Database Migration Issues

```bash
# Check migration status
cd /opt/maritime-trading-green/backend
sudo -u maritime venv/bin/python -m alembic current

# Run migrations manually
sudo -u maritime venv/bin/python -m alembic upgrade head
```

### Emergency Procedures

#### Immediate Rollback

```bash
# If something goes wrong after switch
./blue_green_deployment.sh rollback
```

#### Manual Traffic Switch

```bash
# Manually edit nginx config
sudo nano /etc/nginx/sites-available/maritime-trading
# Change proxy_pass port
sudo systemctl reload nginx
```

## 🎯 Advanced Scenarios

### Database Schema Changes

#### Safe Changes (Compatible)

- Adding new columns with defaults
- Adding new tables
- Adding indexes

#### Unsafe Changes (Breaking)

- Removing columns
- Changing column types
- Removing tables

For unsafe changes, use **multi-phase deployment**:

1. Phase 1: Add new schema alongside old
2. Phase 2: Update application to use new schema
3. Phase 3: Remove old schema

### Canary Deployment Enhancement

```bash
# Route only 10% traffic to new version
# Gradually increase if metrics are good
# Full switch when confident
```

### A/B Testing Integration

```bash
# Run different versions for different user segments
# Compare metrics and performance
# Choose winning version
```

## 📈 Monitoring and Metrics

### Key Metrics to Track

- **Response Time**: Before vs after switch
- **Error Rate**: 5xx errors, application errors
- **Resource Usage**: CPU, memory, disk
- **User Experience**: Page load times
- **Business Metrics**: Conversion rates, user actions

### Alerting Setup

- Health check failures
- Response time degradation
- Error rate increases
- Resource exhaustion

## 🔮 Future Enhancements

### Level 1: Current Implementation

- ✅ Single-server blue-green
- ✅ Zero-downtime switching
- ✅ Automatic rollback

### Level 2: Enhanced Monitoring

- [ ] Automated performance comparison
- [ ] Error rate monitoring
- [ ] Custom health checks
- [ ] Slack/email notifications

### Level 3: Full Automation

- [ ] CI/CD pipeline integration
- [ ] Automated testing in inactive environment
- [ ] Canary deployment support
- [ ] Load balancer integration

### Level 4: Multi-Server

- [ ] True blue-green with separate servers
- [ ] Database clustering
- [ ] Distributed health checks
- [ ] Advanced traffic routing

## 🎪 Integration with Existing Strategy

### Combined Deployment Matrix

| Scenario               | Method                     | Downtime | Use Case               |
| ---------------------- | -------------------------- | -------- | ---------------------- |
| **Development**        | `update_deployment.sh`     | 30s      | Quick iterations       |
| **Production (Small)** | `blue_green_deployment.sh` | 0s       | Critical releases      |
| **Production (Large)** | `blue_green_deployment.sh` | 0s       | All deployments        |
| **Server Migration**   | `migrate_server.sh`        | 5-10min  | Infrastructure changes |

### Decision Tree for Small Servers (Lightsail Phase 1)

```
Does this deployment involve ANY of these?
├── Database migrations → Use Blue-Green Deployment
├── Schema changes → Use Blue-Green Deployment
├── New dependencies → Use Blue-Green Deployment
├── Configuration changes → Use Blue-Green Deployment
├── Production deployment → Use Blue-Green Deployment
└── Only CSS/JS tweaks → Consider Update Deployment

RECOMMENDATION: Default to Blue-Green for 95% of deployments
```

### Why Small Servers Need Blue-Green Most

- **Database migrations** are riskier and slower
- **Single point of failure** - can't afford ANY downtime
- **Early development** = frequent breaking changes
- **Limited resources** make recovery harder
- **User expectations** - even small apps need reliability

Blue-green deployment gives you the confidence to deploy frequently with zero downtime! 🚀
