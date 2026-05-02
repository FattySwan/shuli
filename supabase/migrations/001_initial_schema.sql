-- 初始数据库迁移脚本
-- 创建历史阅读知识库所需的表结构

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 书籍表 (books)
-- ============================================
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    year INTEGER NOT NULL,
    region VARCHAR(100) NOT NULL,
    description TEXT,
    cover_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_books_user_id ON books(user_id);
CREATE INDEX idx_books_year ON books(year);
CREATE INDEX idx_books_region ON books(region);
CREATE INDEX idx_books_user_year ON books(user_id, year);
CREATE INDEX idx_books_user_region ON books(user_id, region);

-- ============================================
-- 读书笔记表 (book_notes)
-- ============================================
CREATE TABLE book_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    page_number INTEGER,
    chapter VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_book_notes_book_id ON book_notes(book_id);
CREATE INDEX idx_book_notes_user_id ON book_notes(user_id);
CREATE INDEX idx_book_notes_user_book ON book_notes(user_id, book_id);

-- ============================================
-- 标签表 (tags)
-- ============================================
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE UNIQUE INDEX idx_tags_user_name ON tags(user_id, name);

-- ============================================
-- 书籍标签关联表 (book_tags)
-- ============================================
CREATE TABLE book_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(book_id, tag_id)
);

-- 创建索引
CREATE INDEX idx_book_tags_book_id ON book_tags(book_id);
CREATE INDEX idx_book_tags_tag_id ON book_tags(tag_id);
CREATE INDEX idx_book_tags_user_id ON book_tags(user_id);

-- ============================================
-- 书籍关联表 (book_relations)
-- ============================================
CREATE TABLE book_relations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    target_book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    relation_type VARCHAR(50) DEFAULT 'related',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(source_book_id, target_book_id)
);

-- 创建索引
CREATE INDEX idx_book_relations_source ON book_relations(source_book_id);
CREATE INDEX idx_book_relations_target ON book_relations(target_book_id);
CREATE INDEX idx_book_relations_user_id ON book_relations(user_id);

-- ============================================
-- 时间轴事件表 (timeline_events)
-- ============================================
CREATE TABLE timeline_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER,
    day INTEGER,
    region VARCHAR(100),
    description TEXT,
    importance INTEGER DEFAULT 1 CHECK (importance BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_timeline_events_user_id ON timeline_events(user_id);
CREATE INDEX idx_timeline_events_year ON timeline_events(year);
CREATE INDEX idx_timeline_events_user_year ON timeline_events(user_id, year);

-- ============================================
-- 启用行级安全 (RLS)
-- ============================================
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 创建 RLS 策略
-- ============================================

-- Books 表策略
CREATE POLICY "Users can only access their own books" ON books
    FOR ALL USING (auth.uid() = user_id);

-- Book Notes 表策略
CREATE POLICY "Users can only access their own book notes" ON book_notes
    FOR ALL USING (auth.uid() = user_id);

-- Tags 表策略
CREATE POLICY "Users can only access their own tags" ON tags
    FOR ALL USING (auth.uid() = user_id);

-- Book Tags 表策略
CREATE POLICY "Users can only access their own book tags" ON book_tags
    FOR ALL USING (auth.uid() = user_id);

-- Book Relations 表策略
CREATE POLICY "Users can only access their own book relations" ON book_relations
    FOR ALL USING (auth.uid() = user_id);

-- Timeline Events 表策略
CREATE POLICY "Users can only access their own timeline events" ON timeline_events
    FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 创建更新时间触发器函数
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要自动更新时间的表创建触发器
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_book_notes_updated_at BEFORE UPDATE ON book_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timeline_events_updated_at BEFORE UPDATE ON timeline_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 授予权限给认证用户
-- ============================================
GRANT ALL ON books TO authenticated;
GRANT ALL ON book_notes TO authenticated;
GRANT ALL ON tags TO authenticated;
GRANT ALL ON book_tags TO authenticated;
GRANT ALL ON book_relations TO authenticated;
GRANT ALL ON timeline_events TO authenticated;

-- 授予序列权限
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
