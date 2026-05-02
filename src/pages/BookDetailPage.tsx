import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBookStore } from '../store/useBookStore';
import { useKnowledgeStore } from '../store/useKnowledgeStore';
import { regions } from '../data/regions';
import { 
  ArrowLeft, BookOpen, Trash2, Edit3, 
  Calendar, MapPin, Plus, FileText, Quote, Hash, ChevronRight,
  Save, X, Loader2
} from 'lucide-react';
import type { BookNote } from '../types';
import { processDoubanImage } from '../lib/imageProxy';
import { BookFormModal } from '../components/BookFormModal';

export function BookDetailPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { books, deleteBook, setEditingBook, setIsAddModalOpen } = useBookStore();
  const { 
    notes, tags, addNote, updateNote, deleteNote, getNotesByBookId, getTagById 
  } = useKnowledgeStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteForm, setNoteForm] = useState({
    title: '',
    content: '',
    pageNumber: '',
    chapter: '',
    quote: '',
    selectedTags: [] as string[],
  });

  const book = books.find(b => b.id === bookId);
  const bookNotes = bookId ? getNotesByBookId(bookId) : [];

  useEffect(() => {
    // 模拟加载延迟，确保数据已加载
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading && !book && bookId) {
      navigate('/');
    }
  }, [book, bookId, navigate, isLoading]);

  // 加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--pastel-pink)] via-[var(--pastel-lavender)] to-[var(--pastel-mint)] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[var(--text-muted)]">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  // 书籍不存在
  if (!book) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--pastel-pink)] via-[var(--pastel-lavender)] to-[var(--pastel-mint)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--text-muted)] mb-4">书籍不存在或已被删除</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-[var(--pastel-coral)] text-white rounded-full font-medium hover:shadow-lg transition-all"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    navigate('/');
  };

  const handleEditBook = () => {
    setEditingBook(book);
    setIsAddModalOpen(true);
  };

  const handleDeleteBook = () => {
    if (confirm('确定要删除这本书吗？相关的笔记也会被删除。')) {
      deleteBook(book.id);
      navigate('/');
    }
  };

  const handleAddNote = () => {
    setIsEditingNote(true);
    setEditingNoteId(null);
    setNoteForm({
      title: '',
      content: '',
      pageNumber: '',
      chapter: '',
      quote: '',
      selectedTags: [],
    });
  };

  const handleEditNote = (note: BookNote) => {
    setIsEditingNote(true);
    setEditingNoteId(note.id);
    setNoteForm({
      title: note.title,
      content: note.content,
      pageNumber: note.pageNumber?.toString() || '',
      chapter: note.chapter || '',
      quote: note.quote || '',
      selectedTags: note.tags,
    });
  };

  const handleSaveNote = () => {
    if (!noteForm.title.trim() || !noteForm.content.trim()) return;

    const noteData = {
      bookId: book.id,
      title: noteForm.title,
      content: noteForm.content,
      pageNumber: noteForm.pageNumber ? parseInt(noteForm.pageNumber) : undefined,
      chapter: noteForm.chapter || undefined,
      quote: noteForm.quote || undefined,
      tags: noteForm.selectedTags,
    };

    if (editingNoteId) {
      updateNote(editingNoteId, noteData);
    } else {
      addNote(noteData);
    }

    setIsEditingNote(false);
    setEditingNoteId(null);
  };

  const handleDeleteNote = (noteId: string) => {
    if (confirm('确定要删除这条笔记吗？')) {
      deleteNote(noteId);
    }
  };

  const toggleTag = (tagId: string) => {
    setNoteForm(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tagId)
        ? prev.selectedTags.filter(id => id !== tagId)
        : [...prev.selectedTags, tagId]
    }));
  };

  const regionNames = book.region
    ? [regions.find(r => r.id === book.region)?.name].filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--pastel-pink)] via-[var(--pastel-lavender)] to-[var(--pastel-mint)]">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-white/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 hover:bg-white transition-all duration-200 text-[var(--text-dark)] font-medium shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            返回时间轴
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleEditBook}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--pastel-coral)] text-white font-medium hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              <Edit3 className="w-4 h-4" />
              编辑书籍
            </button>
            <button
              onClick={handleDeleteBook}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 text-[var(--pastel-coral)] font-medium hover:bg-white transition-all duration-200 shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              删除
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Book Info Section */}
        <div className="glass rounded-3xl p-8 mb-8 shadow-[var(--shadow-soft)]">
          <div className="flex gap-8">
            {/* Cover */}
            <div className="flex-shrink-0">
              <div className="w-48 h-72 rounded-2xl shadow-[var(--shadow-colorful)] overflow-hidden bg-gradient-to-br from-[var(--pastel-pink)] to-[var(--pastel-lavender)] border-4 border-white">
                {book.coverImage ? (
                  <img
                    src={processDoubanImage(book.coverImage)}
                    alt={book.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '';
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-[var(--pastel-coral)]">
                    <BookOpen className="w-16 h-16" />
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-[var(--text-dark)] font-display mb-2">
                    {book.title}
                  </h1>
                  <p className="text-lg text-[var(--text-muted)]">
                    {book.author}
                  </p>
                </div>

              </div>



              {/* Meta Info */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-3 p-4 bg-white/60 rounded-2xl">
                  <div className="p-2 bg-[var(--pastel-coral)]/20 rounded-xl">
                    <Calendar className="w-5 h-5 text-[var(--pastel-coral)]" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">历史年份</p>
                    <p className="text-sm font-semibold text-[var(--text-dark)]">
                      {book.year < 0 
                        ? `${Math.abs(book.year)} BC` 
                        : `${book.year} AD`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white/60 rounded-2xl">
                  <div className="p-2 bg-[var(--pastel-mint)] rounded-xl">
                    <MapPin className="w-5 h-5 text-[var(--text-dark)]" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">涉及地区</p>
                    <p className="text-sm font-semibold text-[var(--text-dark)]">
                      {regionNames.join('、')}
                    </p>
                  </div>
                </div>


              </div>

              {/* Book Description */}
              {book.description && (
                <div className="p-4 bg-white/60 rounded-2xl">
                  <p className="text-xs text-[var(--text-muted)] mb-2">书籍简介</p>
                  <p className="text-sm text-[var(--text-dark)] leading-relaxed">{book.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="glass rounded-3xl p-8 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--pastel-coral)] rounded-xl">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-[var(--text-dark)] font-display">
                读书笔记
              </h2>
              <span className="px-3 py-1 bg-white/60 rounded-full text-sm text-[var(--text-muted)]">
                {bookNotes.length} 条
              </span>
            </div>
            <button
              onClick={handleAddNote}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[var(--pastel-coral)] to-[var(--pastel-coral-light)] text-white rounded-full font-semibold hover:shadow-[var(--shadow-colorful)] hover:scale-105 transition-all duration-300"
            >
              <Plus className="w-4 h-4" />
              添加笔记
            </button>
          </div>

          {/* Note Form */}
          {isEditingNote && (
            <div className="mb-6 p-6 bg-white/80 rounded-2xl border-2 border-[var(--pastel-coral)]/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-dark)]">
                  {editingNoteId ? '编辑笔记' : '新建笔记'}
                </h3>
                <button
                  onClick={() => setIsEditingNote(false)}
                  className="p-2 hover:bg-[var(--pastel-pink)] rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-[var(--text-muted)]" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-dark)] mb-2">
                    笔记标题
                  </label>
                  <input
                    type="text"
                    value={noteForm.title}
                    onChange={(e) => setNoteForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border-light)] focus:border-[var(--pastel-coral)] focus:outline-none transition-colors bg-white"
                    placeholder="输入笔记标题..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-dark)] mb-2">
                      章节
                    </label>
                    <input
                      type="text"
                      value={noteForm.chapter}
                      onChange={(e) => setNoteForm(prev => ({ ...prev, chapter: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border-light)] focus:border-[var(--pastel-coral)] focus:outline-none transition-colors bg-white"
                      placeholder="如：第一章"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-dark)] mb-2">
                      页码
                    </label>
                    <input
                      type="number"
                      value={noteForm.pageNumber}
                      onChange={(e) => setNoteForm(prev => ({ ...prev, pageNumber: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border-light)] focus:border-[var(--pastel-coral)] focus:outline-none transition-colors bg-white"
                      placeholder="如：45"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-dark)] mb-2">
                    原文引用
                  </label>
                  <textarea
                    value={noteForm.quote}
                    onChange={(e) => setNoteForm(prev => ({ ...prev, quote: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border-light)] focus:border-[var(--pastel-coral)] focus:outline-none transition-colors bg-white resize-none"
                    rows={2}
                    placeholder="摘录书中的原文..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-dark)] mb-2">
                    笔记内容
                  </label>
                  <textarea
                    value={noteForm.content}
                    onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border-light)] focus:border-[var(--pastel-coral)] focus:outline-none transition-colors bg-white resize-none"
                    rows={5}
                    placeholder="记录你的阅读心得..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-dark)] mb-2">
                    标签
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                          noteForm.selectedTags.includes(tag.id)
                            ? 'text-white shadow-md scale-105'
                            : 'bg-white/60 text-[var(--text-muted)] hover:bg-white'
                        }`}
                        style={{
                          backgroundColor: noteForm.selectedTags.includes(tag.id) ? tag.color : undefined
                        }}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setIsEditingNote(false)}
                    className="px-6 py-2.5 rounded-full bg-white/80 text-[var(--text-muted)] font-medium hover:bg-white transition-all duration-200"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveNote}
                    disabled={!noteForm.title.trim() || !noteForm.content.trim()}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[var(--pastel-coral)] to-[var(--pastel-coral-light)] text-white font-medium hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    保存笔记
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notes List */}
          <div className="space-y-4">
            {bookNotes.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--pastel-pink)] flex items-center justify-center">
                  <FileText className="w-8 h-8 text-[var(--pastel-coral)]" />
                </div>
                <p className="text-[var(--text-muted)] mb-2">还没有读书笔记</p>
                <p className="text-sm text-[var(--text-light)]">点击上方按钮添加你的第一条笔记</p>
              </div>
            ) : (
              bookNotes.map((note) => {
                const noteTags = note.tags.map(tagId => getTagById(tagId)).filter(Boolean);
                return (
                  <div
                    key={note.id}
                    className="group p-6 bg-white/60 rounded-2xl hover:bg-white/80 transition-all duration-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-[var(--text-dark)]">
                          {note.title}
                        </h3>
                        {noteTags.length > 0 && (
                          <div className="flex gap-1">
                            {noteTags.map(tag => tag && (
                              <span
                                key={tag.id}
                                className="px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
                                style={{ backgroundColor: tag.color }}
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditNote(note)}
                          className="p-2 hover:bg-[var(--pastel-pink)] rounded-xl transition-colors"
                        >
                          <Edit3 className="w-4 h-4 text-[var(--text-muted)]" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-2 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>

                    {(note.chapter || note.pageNumber) && (
                      <div className="flex items-center gap-4 mb-3 text-xs text-[var(--text-muted)]">
                        {note.chapter && (
                          <span className="flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            {note.chapter}
                          </span>
                        )}
                        {note.pageNumber && (
                          <span className="flex items-center gap-1">
                            <ChevronRight className="w-3 h-3" />
                            第 {note.pageNumber} 页
                          </span>
                        )}
                      </div>
                    )}

                    {note.quote && (
                      <div className="mb-3 p-3 bg-[var(--pastel-pink)]/30 rounded-xl border-l-4 border-[var(--pastel-coral)]">
                        <div className="flex items-center gap-1 mb-1 text-[var(--pastel-coral)]">
                          <Quote className="w-3 h-3" />
                          <span className="text-[10px] font-medium">原文引用</span>
                        </div>
                        <p className="text-sm text-[var(--text-dark)] italic">{note.quote}</p>
                      </div>
                    )}

                    <p className="text-sm text-[var(--text-dark)] leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </p>

                    <p className="mt-3 text-xs text-[var(--text-light)]">
                      {new Date(note.updatedAt).toLocaleDateString('zh-CN')} 更新
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
      
      {/* 编辑书籍弹窗 */}
      <BookFormModal />
    </div>
  );
}
