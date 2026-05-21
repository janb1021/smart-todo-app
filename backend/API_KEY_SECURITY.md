# API 密钥安全管理指南

## 重要原则

| 原则 | 说明 |
|------|------|
| **绝不提交真实密钥** | `.env` 文件已在 `.gitignore` 中，不会被提交 |
| **使用模板文件** | `.env.example` 作为配置模板提交到仓库 |
| **定期轮换密钥** | 建议 90 天更换一次 API 密钥 |
| **最小权限原则** | 只授予必要的 API 权限 |

## 密钥轮换步骤

### 1. 获取新密钥

访问 [DeepSeek 开放平台](https://platform.deepseek.com/) → API Keys → 创建新密钥

### 2. 更新环境变量

编辑 `backend/.env` 文件：

```bash
# 旧值（即将失效）
DEEPSEEK_API_KEY="sk-72abcf98cb31429ba791083f952a5588"

# 新值（立即生效）
DEEPSEEK_API_KEY="sk-new-key-here"
```

### 3. 重启服务

```bash
# 重启后端服务
cd backend
npm run dev
```

### 4. 验证新密钥

```bash
curl http://localhost:3000/api/ai/health
```

返回 `{"success": true}` 表示新密钥生效。

### 5. 废弃旧密钥（可选）

在 DeepSeek 控制台删除旧密钥。

## 密钥安全检查清单

- [ ] `.env` 文件在 `.gitignore` 中 ✓
- [ ] 不在代码中硬编码密钥 ✓
- [ ] 使用强随机字符串作为 JWT_SECRET
- [ ] 定期检查 API 使用量，发现异常及时轮换
- [ ] 生产环境使用不同的密钥

## 密钥泄露应急处理

如果怀疑密钥泄露：

1. **立即轮换** - 在 API 提供商控制台生成新密钥
2. **更新配置** - 修改 `.env` 文件并重启服务
3. **审查日志** - 检查异常的 API 调用记录
4. **通知团队** - 确保所有相关人员知晓密钥已变更

## 相关文件

| 文件 | 用途 |
|------|------|
| `backend/.env` | 实际配置（不提交） |
| `backend/.env.example` | 配置模板（提交到仓库） |
| `.gitignore` | 忽略规则 |

---
最后更新：2026-05-20
