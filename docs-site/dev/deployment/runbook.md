# 运维手册

本文档汇总常见的运维操作和故障排查步骤。

## 日常运维

### 应用启停

```bash
# 启动
systemctl start victor-ab

# 停止
systemctl stop victor-ab

# 重启
systemctl restart victor-ab

# 查看状态
systemctl status victor-ab
```

### 日志查看

```bash
# 实时查看日志
tail -f /var/log/victor/victor.log

# 查看错误日志
grep ERROR /var/log/victor/victor.log

# 查看最近 100 行
tail -n 100 /var/log/victor/victor.log
```

## 故障排查

### 应用无法启动

1. 检查端口占用
   ```bash
   lsof -i :8080
   ```

2. 检查数据库连接
   ```bash
   mysql -h localhost -u root -p -e "SELECT 1"
   ```

3. 检查配置文件
   ```bash
   cat application.yml | grep -A5 spring:
   ```

### 数据库连接失败

1. 确认 MySQL 服务运行
   ```bash
   docker-compose ps mysql
   ```

2. 验证连接信息
   ```bash
   mysql -h <host> -P 3306 -u root -p
   ```

3. 检查连接数
   ```sql
   SHOW STATUS LIKE 'Threads_connected';
   ```

### 性能问题

1. 检查 JVM 内存
   ```bash
   jstat -gc <pid>
   ```

2. 分析慢查询
   ```sql
   SHOW FULL PROCESSLIST;
   ```

3. 查看线程状态
   ```bash
   jstack <pid>
   ```

## 备份与恢复

### 数据库备份

```bash
mysqldump -h localhost -u root -p victor_experiment > backup_$(date +%Y%m%d).sql
```

### 数据恢复

```bash
mysql -h localhost -u root -p victor_experiment < backup_20240501.sql
```

## 版本升级

1. 备份数据库
2. 停止服务
3. 部署新版本 JAR
4. 启动服务并检查日志
5. 验证功能正常