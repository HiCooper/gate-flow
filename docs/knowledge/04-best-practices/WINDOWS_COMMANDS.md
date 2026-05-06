# Windows 环境命令执行快速参考

## 🚨 重要原则
**当前环境**: Windows CMD (不是PowerShell, 不是Linux Bash)

---

## ✅ curl 命令

### 基本用法
```bash
# GET 请求
C:\Windows\System32\curl.exe -s http://localhost:8081/api/v1/experiments

# POST 请求（JSON body）
C:\Windows\System32\curl.exe -X POST http://localhost:8081/api/v1/experiments ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test\",\"description\":\"Test experiment\"}"

# PUT 请求
C:\Windows\System32\curl.exe -X PUT http://localhost:8081/api/v1/experiments/5 ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Updated Name\"}"

# URL 带参数（使用双引号）
C:\Windows\System32\curl.exe -s "http://localhost:8081/api/v1/experiments/5/versions/compare?v1=20260506194239&v2=20260506215519"
```

### ⚠️ 注意事项
- ❌ 不要用管道 `|` 处理JSON
- ❌ 不要用 `| ConvertFrom-Json`（这是PowerShell）
- ✅ JSON中的引号需要转义 `\"`
- ✅ URL有特殊字符用双引号包裹
- ✅ 多行命令使用 `^`（不是 `\`）

---

## ✅ 目录切换

### 错误方式 ❌
```bash
# 不支持分号连接
cd apps\admin; pnpm dev

# 不支持 && 
cd apps\admin && pnpm dev
```

### 正确方式 ✅
```bash
# 方式1: 分开执行（推荐）
cd d:\Projects\gate-flow\apps\admin
pnpm dev

# 方式2: 使用pnpm workspace
pnpm --filter @gate-flow/admin dev

# 方式3: 使用完整路径
pnpm --prefix d:\Projects\gate-flow\apps\admin dev
```

---

## ✅ 进程管理

### 查看端口占用
```bash
netstat -ano | findstr :8081
```

### 终止进程
```bash
# 通过PID
taskkill /F /PID 26088

# 通过进程名
taskkill /F /IM node.exe
```

---

## ✅ PowerShell 命令

### 如果需要使用PowerShell命令
```bash
# 方式1: 使用powershell前缀
powershell -Command "Invoke-RestMethod -Uri 'http://localhost:8081/api/v1/experiments' -Method Get"

# 方式2: 进入PowerShell环境
powershell
# 然后执行PowerShell命令
```

### 常用PowerShell命令（需要powershell -Command前缀）
```powershell
# JSON处理
Invoke-RestMethod -Uri "http://localhost:8081/api/v1/experiments" -Method Get | ConvertTo-Json

# 文件读取
Get-Content -Path "file.log" -Tail 50

# 数据过滤
... | Select-Object -First 3 | Format-Table
```

---

## ✅ pnpm/npm 命令

### 在项目根目录
```bash
# 安装依赖
pnpm install

# 启动特定应用
pnpm --filter @gate-flow/admin dev
pnpm --filter @gate-flow/marketing dev

# 构建
pnpm --filter @gate-flow/admin build
```

### 在特定目录
```bash
cd d:\Projects\gate-flow\apps\admin
pnpm dev
pnpm build
```

---

## 🚫 常见错误对照表

| 错误命令 ❌ | 正确命令 ✅ | 原因 |
|------------|------------|------|
| `curl -s http://...` | `C:\Windows\System32\curl.exe -s http://...` | curl需要完整路径 |
| `curl ... \| ConvertFrom-Json` | 直接查看curl输出 | cmd不支持管道处理JSON |
| `cd path; command` | 分开两行执行 | cmd不支持分号连接 |
| `cd path && command` | 分开两行执行 | cmd不支持&&连接 |
| `Get-Content file.log` | `powershell -Command "Get-Content file.log"` | PowerShell专用命令 |
| `Invoke-RestMethod ...` | 使用curl或加powershell前缀 | PowerShell专用命令 |
| `tail -f file.log` | `powershell -Command "Get-Content file.log -Tail 50"` | Linux命令不可用 |

---

## 💡 最佳实践

1. **curl命令**: 始终使用完整路径 `C:\Windows\System32\curl.exe`
2. **目录切换**: 单独执行cd命令，不要链式连接
3. **复杂命令**: 优先使用pnpm workspace语法
4. **PowerShell命令**: 需要时添加 `powershell -Command` 前缀
5. **多行命令**: 使用 `^` 而不是 `\`
6. **JSON处理**: 直接在curl中处理，不要用管道

---

## 🔍 调试技巧

### 检查当前shell类型
```bash
# 查看环境变量
echo %COMSPEC%

# 如果是CMD，会显示: C:\Windows\system32\cmd.exe
```

### 测试curl是否可用
```bash
C:\Windows\System32\curl.exe --version
```

### 查看可用命令
```bash
# 查看内部命令
help

# 查看外部命令
where curl
where powershell
```

---

## 📌 快速复制模板

### API测试模板
```bash
# GET
C:\Windows\System32\curl.exe -s http://localhost:8081/api/v1/experiments

# POST
C:\Windows\System32\curl.exe -X POST http://localhost:8081/api/v1/experiments -H "Content-Type: application/json" -d "{\"name\":\"test\"}"

# PUT
C:\Windows\System32\curl.exe -X PUT http://localhost:8081/api/v1/experiments/5 -H "Content-Type: application/json" -d "{\"name\":\"updated\"}"

# DELETE
C:\Windows\System32\curl.exe -X DELETE http://localhost:8081/api/v1/experiments/5
```

### 服务启动模板
```bash
# 后端（Maven）
cd d:\Projects\gate-flow\backend\victor-service
mvn spring-boot:run

# 前端（pnpm workspace）
pnpm --filter @gate-flow/admin dev

# 前端（直接cd）
cd d:\Projects\gate-flow\apps\admin
pnpm dev
```
