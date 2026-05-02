# Supabase 云端数据库配置指南

## 1. 创建 Supabase 项目

1. 访问 [Supabase Dashboard](https://app.supabase.com)
2. 点击 "New Project"
3. 填写项目信息：
   - **Name**: history-reading-db (或你喜欢的名字)
   - **Database Password**: 设置一个强密码
   - **Region**: 选择离你最近的区域 (推荐 Asia Pacific - Singapore)
4. 点击 "Create new project"
5. 等待项目创建完成 (约 1-2 分钟)

## 2. 获取 API 密钥

项目创建完成后：

1. 点击左侧菜单 "Project Settings"
2. 选择 "API" 标签页
3. 复制以下信息：
   - **URL**: `https://xxxx.supabase.co`
   - **anon public**: `eyJ...` (以 eyJ 开头的长字符串)

## 3. 配置环境变量

在项目根目录创建 `.env` 文件：

```bash
# Supabase 配置
VITE_SUPABASE_URL=https://你的项目URL.supabase.co
VITE_SUPABASE_ANON_KEY=你的anon_key
```

**注意**: 
- 替换为实际的 URL 和 Anon Key
- `.env` 文件已添加到 `.gitignore`，不会被提交到 Git

## 4. 执行数据库迁移

### 方法 A: 使用 Supabase Dashboard (推荐)

1. 在 Supabase Dashboard 中，点击左侧 "SQL Editor"
2. 点击 "New query"
3. 打开 `supabase/migrations/001_initial_schema.sql` 文件
4. 复制全部内容粘贴到 SQL Editor
5. 点击 "Run" 执行

### 方法 B: 使用 Supabase CLI (可选)

如果你安装了 Supabase CLI：

```bash
supabase login
supabase link --project-ref 你的项目引用ID
supabase db push
```

## 5. 验证数据库配置

执行以下 SQL 查询验证表是否创建成功：

```sql
-- 查看所有表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 应该看到: books, book_notes, tags, book_tags, book_relations, timeline_events
```

## 6. 配置认证 (Authentication)

### 6.1 启用邮箱认证

1. 在 Supabase Dashboard 中，点击 "Authentication"
2. 选择 "Providers" 标签页
3. 确保 "Email" 已启用
4. 可选: 配置邮件模板

### 6.2 配置站点 URL (部署后)

1. 在 "Authentication" > "URL Configuration" 中
2. 添加你的生产环境域名
3. 配置回调 URL: `https://你的域名/auth/callback`

## 7. 测试连接

启动开发服务器后，打开浏览器控制台查看是否有 Supabase 连接错误。

## 常见问题

### Q: 出现 "permission denied" 错误？
确保已正确执行 RLS 策略的 SQL 脚本。

### Q: 数据没有保存？
检查网络请求，确认 `user_id` 已正确设置。

### Q: 如何重置数据库？
在 SQL Editor 中执行：
```sql
DROP TABLE IF EXISTS book_tags, book_relations, book_notes, tags, timeline_events, books CASCADE;
```
然后重新执行迁移脚本。

## 下一步

数据库配置完成后，应用会自动：
1. 使用 Supabase 进行用户认证
2. 将书籍、笔记等数据存储到云端
3. 支持多用户同时使用
4. 数据在不同设备间同步
