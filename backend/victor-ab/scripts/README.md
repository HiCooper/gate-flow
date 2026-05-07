# Victor 数据库脚本

本目录包含 Victor A/B 测试平台的所有数据库相关脚本。

## 📁 目录结构

```
scripts/
├── seed/              # 种子数据脚本
├── maintenance/       # 运维和维护脚本
└── examples/          # 示例和参考脚本
```

## 📋 脚本分类说明

### 1. Seed Scripts (`seed/`)

**用途**: 初始化数据、测试数据、演示数据

**包含内容**:
- `insert_variants.sql` - 插入实验变体示例数据

**使用场景**:
- 新环境初始化后填充基础数据
- 开发环境准备测试数据
- 演示环境准备示例数据

**执行方式**:
```bash
mysql -h localhost -u root -p victor_experiment < scripts/seed/insert_variants.sql
```

---

### 2. Maintenance Scripts (`maintenance/`)

**用途**: 日常运维、数据修复、状态更新

**包含内容**:
- `update_exp_status.sql` - 更新实验状态示例

**使用场景**:
- 手动修复数据问题
- 批量更新实验状态
- 数据迁移和清理

**⚠️ 注意事项**:
- 执行前务必备份相关数据
- 建议在事务中执行，确认无误后提交
- 生产环境执行需要审批

**执行方式**:
```bash
# 先预览影响范围
mysql -h localhost -u root -p victor_experiment -e "SELECT * FROM victor_experiment WHERE id = 1;"

# 执行更新
mysql -h localhost -u root -p victor_experiment < scripts/maintenance/update_exp_status.sql

# 验证结果
mysql -h localhost -u root -p victor_experiment -e "SELECT id, status FROM victor_experiment WHERE id = 1;"
```

---

### 3. Examples (`examples/`)

**用途**: 参考示例、常用查询模板

**包含内容**:
- 常用查询示例
- 数据导出脚本
- 性能优化示例

**使用场景**:
- 学习数据库结构
- 快速编写自定义查询
- 调试和排查问题

---

## 🔗 与其他脚本的关系

### Flyway 迁移脚本

位置: `victor-infrastructure/src/main/resources/db/migration/`

**用途**: 数据库 schema 变更（表结构、索引等）

**特点**:
- ✅ 自动执行（应用启动时）
- ✅ 版本控制（V1, V2, V3...）
- ✅ 幂等性保证
- ❌ **不要**手动执行

**示例**:
- `V1__init_schema.sql` - 初始化所有表结构
- `V2__add_variant_versioning.sql` - 添加版本控制字段

---

### Docker 初始化脚本

位置: `docker/init-db/`

**用途**: Docker 容器首次启动时的初始化

**包含内容**:
- `01-create-events-table.sql` - ClickHouse events 表创建

**特点**:
- 仅在容器首次启动时执行
- 用于外部依赖服务（ClickHouse）初始化

---

### 旧版初始化脚本

位置: `init-db-simple.sql`（根目录）

**状态**: ⚠️ **已废弃**

**说明**:
- 这是 Flyway 迁移之前的手动初始化脚本
- 已被 `V1__init_schema.sql` 替代
- 保留仅作为参考
- **不建议在新环境中使用**

---

## 📖 最佳实践

### 1. Schema 变更流程

```mermaid
graph LR
    A[开发环境测试] --> B[创建 Flyway 迁移脚本]
    B --> C[本地验证]
    C --> D[代码审查]
    D --> E[合并到主分支]
    E --> F[自动部署执行]
```

**规则**:
- ✅ 所有表结构变更必须通过 Flyway
- ✅ 迁移脚本命名: `V{version}__{description}.sql`
- ✅ 迁移脚本一旦执行不可修改
- ❌ 禁止手动执行 ALTER TABLE

### 2. 数据操作规范

**Seed 数据**:
```sql
-- ✅ 使用 INSERT IGNORE 避免重复
INSERT IGNORE INTO victor_domain (domain_id, name) VALUES 
('default', '默认域');

-- ❌ 避免直接 INSERT 可能导致主键冲突
INSERT INTO victor_domain (domain_id, name) VALUES 
('default', '默认域');
```

**Maintenance 脚本**:
```sql
-- ✅ 在事务中执行
START TRANSACTION;

UPDATE victor_experiment SET status = 'running' WHERE id = 1;

-- 验证结果
SELECT * FROM victor_experiment WHERE id = 1;

-- 确认无误后提交
COMMIT;

-- 如有问题回滚
-- ROLLBACK;
```

### 3. 脚本编写规范

**文件头注释**:
```sql
-- ============================================
-- 脚本名称: insert_variants.sql
-- 用途: 为实验 ID=1 插入对照组和实验组
-- 创建日期: 2026-05-07
-- 作者: Your Name
-- 影响范围: victor_variant 表
-- ============================================
```

**安全性检查**:
```sql
-- ✅ 执行前检查条件
SELECT COUNT(*) as count FROM victor_experiment WHERE id = 1;
-- 确认存在后再执行后续操作

-- ✅ 使用 WHERE 条件限制影响范围
DELETE FROM victor_variant WHERE exp_id = 1 AND variant_key = 'test';

-- ❌ 避免无条件操作
DELETE FROM victor_variant;  -- 危险！
```

---

## 🛠️ 常用命令

### 连接数据库

```bash
# MySQL
mysql -h localhost -u root -p victor_experiment

# 查看表结构
DESCRIBE victor_experiment;

# 查看所有表
SHOW TABLES;
```

### 执行脚本

```bash
# 执行单个脚本
mysql -h localhost -u root -p victor_experiment < scripts/seed/insert_variants.sql

# 交互式执行
mysql -h localhost -u root -p victor_experiment
source scripts/seed/insert_variants.sql;
```

### 备份和恢复

```bash
# 备份整个数据库
mysqldump -h localhost -u root -p victor_experiment > backup_$(date +%Y%m%d).sql

# 备份特定表
mysqldump -h localhost -u root -p victor_experiment victor_experiment > backup_experiment.sql

# 恢复数据库
mysql -h localhost -u root -p victor_experiment < backup_20260507.sql
```

---

## 📊 数据库 ER 图

```
victor_domain (域)
    └── victor_layer (层)
            └── victor_experiment (实验)
                    ├── victor_variant (变体)
                    └── victor_user_assignment (用户分配)

victor_config_version (配置版本)
```

详细表结构请参考 Flyway 迁移脚本或 Swagger API 文档。

---

## 🔍 故障排查

### 问题 1: 脚本执行失败

**症状**: `ERROR 1062 (23000): Duplicate entry`

**原因**: 数据已存在

**解决**:
```sql
-- 检查是否存在
SELECT * FROM victor_variant WHERE exp_id = 1;

-- 如果存在，先删除或使用 INSERT IGNORE
DELETE FROM victor_variant WHERE exp_id = 1;
-- 然后重新执行脚本
```

### 问题 2: 外键约束错误

**症状**: `ERROR 1452 (23000): Cannot add or update a child row`

**原因**: 引用的父记录不存在

**解决**:
```sql
-- 检查父记录是否存在
SELECT * FROM victor_experiment WHERE id = 1;

-- 如果不存在，先创建父记录
```

### 问题 3: Flyway 迁移冲突

**症状**: `FlywayException: Found more than one migration with version X`

**原因**: 版本号重复

**解决**:
- 检查 `flyway_schema_history` 表
- 确保每个迁移脚本版本号唯一
- 不要修改已执行的迁移脚本

---

## 📝 维护清单

### 定期检查项

- [ ] 清理过期的测试数据
- [ ] 验证备份完整性
- [ ] 检查慢查询日志
- [ ] 更新统计信息 (`ANALYZE TABLE`)
- [ ] 检查磁盘空间使用

### 性能优化

```sql
-- 分析表统计信息
ANALYZE TABLE victor_experiment;
ANALYZE TABLE victor_variant;

-- 检查索引使用情况
SHOW INDEX FROM victor_experiment;

-- 查找慢查询
SELECT * FROM information_schema.processlist 
WHERE TIME > 5 
ORDER BY TIME DESC;
```

---

## 📞 联系方式

如有数据库相关问题，请联系:
- DBA 团队: dba@gateflow.com
- 技术支持: support@gateflow.com

---

**最后更新**: 2026-05-07  
**维护者**: GateFlow Team
