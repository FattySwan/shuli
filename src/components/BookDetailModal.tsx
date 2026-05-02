import { useBookStore } from '../store/useBookStore';
import { getRegionColor, regions } from '../data/regions';
import { X, BookOpen, Trash2, Edit3, Calendar, MapPin } from 'lucide-react';
import { processDoubanImage } from '../lib/imageProxy';

export function BookDetailModal() {
  const { selectedBook, selectBook, deleteBook, setEditingBook, setIsAddModalOpen } = useBookStore();

  if (!selectedBook) return null;

  const handleClose = () => {
    selectBook(null);
  };

  const handleEdit = () => {
    setEditingBook(selectedBook);
    setIsAddModalOpen(true);
    selectBook(null);
  };

  const handleDelete = () => {
    if (confirm('确定要删除这本书吗？')) {
      deleteBook(selectedBook.id);
    }
  };

  const regionName = selectedBook.region
    ? regions.find(r => r.id === selectedBook.region)?.name
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden border border-[#e5e5e7]" style={{ animation: 'bookStackFadeIn 0.2s ease-out' }}>
        {/* Header */}
        <div className="h-24 bg-[#fafafa] border-b border-[#e5e5e7] relative">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white border border-[#e5e5e7] rounded-lg text-[#6e6e73] hover:bg-[#f5f5f7] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="flex gap-5 -mt-12">
            <div className="flex-shrink-0">
              <div className="w-28 h-40 rounded-xl shadow-md overflow-hidden bg-[#f5f5f7] border-2 border-white">
                {selectedBook.coverImage ? (
                  <img
                    src={processDoubanImage(selectedBook.coverImage)}
                    alt={selectedBook.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-[#c7c7cc]">
                    <BookOpen className="w-10 h-10" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 pt-12">
              <h2 className="text-xl font-semibold text-[#1d1d1f] mb-1">
                {selectedBook.title}
              </h2>
              <p className="text-sm text-[#6e6e73] mb-3">
                {selectedBook.author}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="flex items-center gap-2.5 p-3 bg-[#fafafa] rounded-xl border border-[#e5e5e7]">
              <div className="p-1.5 bg-white rounded-lg border border-[#e5e5e7]">
                <Calendar className="w-4 h-4 text-[#007aff]" />
              </div>
              <div>
                <p className="text-[11px] text-[#6e6e73]">历史年份</p>
                <p className="text-sm font-medium text-[#1d1d1f]">
                  {selectedBook.year < 0 
                    ? `${Math.abs(selectedBook.year)} 公元前` 
                    : `${selectedBook.year} 年`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 bg-[#fafafa] rounded-xl border border-[#e5e5e7]">
              <div className="p-1.5 bg-white rounded-lg border border-[#e5e5e7]">
                <MapPin className="w-4 h-4 text-[#007aff]" />
              </div>
              <div>
                <p className="text-[11px] text-[#6e6e73]">涉及地区</p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {regionName && (
                    <span
                      className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-white border border-[#e5e5e7]"
                      style={{ 
                        color: getRegionColor(selectedBook.region)
                      }}
                    >
                      {regionName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {selectedBook.description && (
            <div className="mt-5">
              <p className="text-xs text-[#6e6e73] mb-2">书籍简介</p>
              <div className="p-3 bg-[#fafafa] rounded-xl border border-[#e5e5e7]">
                <p className="text-sm text-[#1d1d1f] leading-relaxed">{selectedBook.description}</p>
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-6">
            <button
              onClick={handleEdit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#007aff] text-white text-sm font-medium rounded-lg hover:bg-[#0051d5] transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              编辑
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-[#ff3b30] text-sm font-medium rounded-lg border border-[#e5e5e7] hover:bg-[#fff5f5] transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
