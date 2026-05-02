# 书历 - 部署指南

## 方案一：Vercel 部署（推荐）

### 1. 准备工作

- 注册 [Vercel](https://vercel.com) 账号（可以用 GitHub 账号登录）
- 注册 [Supabase](https://supabase.com) 账号（数据库）

### 2. 部署步骤

#### 步骤 1：推送代码到 GitHub

```bash
# 初始化 git（如果还没做）
git init
git add .
git commit -m "Initial commit"

# 创建 GitHub 仓库并推送
git remote add origin https://github.com/你的用户名/shuli.git
git push -u origin main
```

#### 步骤 2：在 Vercel 上部署

1. 登录 [Vercel](https://vercel.com)
2. 点击 "Add New Project"
3. 导入你的 GitHub 仓库
4. 配置环境变量（见下方）
5. 点击 Deploy

#### 步骤 3：配置环境变量

在 Vercel 项目设置中，添加以下环境变量：

```
VITE_SUPABASE_URL=你的Supabase项目URL
VITE_SUPABASE_ANON_KEY=你的Supabase匿名密钥
```

### 3. 配置 Supabase 数据库

1. 登录 [Supabase](https://supabase.com)
2. 创建新项目
3. 在 SQL Editor 中执行 `supabase/migrations/001_initial_schema.sql` 文件中的 SQL
4. 在 Authentication 中启用邮箱登录
5. 复制项目 URL 和 Anon Key 到 Vercel 环境变量

### 4. 自定义域名（可选）

1. 在 Vercel 项目设置中，点击 "Domains"
2. 添加你的域名
3. 按照提示配置 DNS

---

## 方案二：Netlify 部署

### 步骤

1. 登录 [Netlify](https://netlify.com)
2. 点击 "Add new site" → "Import an existing project"
3. 选择 GitHub 仓库
4. 构建设置：
   - Build command: `npm run build`
   - Publish directory: `dist`
5. 添加环境变量（同上）
6. 点击 Deploy

---

## 方案三：静态托管（最简单，无后端）

如果只是展示，可以纯静态部署：

```bash
# 构建
npm run build

# 部署到任意静态托管服务
dist/ 文件夹就是完整的网站
```

---

## 注意事项

### 免费额度

- **Vercel**: 每月 100GB 带宽，足够个人使用
- **Supabase**: 每月 500MB 数据库，500MB 存储，足够起步

### 数据备份

建议定期备份 Supabase 数据库：

1. 在 Supabase Dashboard 中点击 "Database"
2. 选择 "Backups" 标签
3. 可以手动备份或设置自动备份

### 更新部署

每次代码更新后，推送到 GitHub 会自动触发重新部署。

---

## 需要帮助？

- Vercel 文档：https://vercel.com/docs
- Supabase 文档：https://supabase.com/docs
- 项目问题：在 GitHub 上提交 Issue
