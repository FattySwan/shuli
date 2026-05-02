import { useState } from 'react';
import type { Book } from '../types';
import { BookCard } from './BookCard';
import { getRegionColor } from '../data/regions';
import { Layers, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { useBookStore } from '../store/useBookStore';
import { createPortal } from 'react-dom';
import { processDoubanImage } from '../lib/imageProxy';

interface BookStackProps {
  books: Book[];
  year: number;
  regionId: string;
}

// 当 pixelsPerYear 超过此值时，书籍自动展开为平铺布局
const EXPAND_THRESHOLD = 40;

export function BookStack({ books, year, regionId }: BookStackProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { openAddModal, pixelsPerYear } = useBookStore();

  const regionColor = getRegionColor(regionId);
  const bookCount = books.length;

  // 当缩放比例足够大时，自动展开为平铺布局
  const shouldExpandFlat = pixelsPerYear >= EXPAND_THRESHOLD && bookCount > 1;

  const sortedBooks = [...books].sort((a, b) => {
    return a.title.localeCompare(b.title);
  });

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : sortedBooks.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < sortedBooks.length - 1 ? 0 : prev + 1));
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(false);
    openAddModal({
      publishYear: year,
      regions: [regionId]
    });
  };

  const handleClose = () => {
    setIsExpanded(false);
    setCurrentIndex(0);
  };

  const handleStackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(true);
  };

  // 只有一本书时直接显示
  if (bookCount === 1) {
    return <BookCard book={sortedBooks[0]} />;
  }

  // 当缩放比例足够大时，展开为横向平铺布局
  // 书籍从所在年份位置开始向右排列，与时间轴对齐
  if (shouldExpandFlat) {
    return (
      <div className="flex flex-row gap-3 items-start">
        {sortedBooks.map((book, index) => (
          <div
            key={book.id}
            className="transform hover:scale-105 transition-transform duration-300 flex-shrink-0"
            style={{
              zIndex: sortedBooks.length - index,
            }}
          >
            <BookCard book={book} />
          </div>
        ))}
      </div>
    );
  }

  const expandedModal = isExpanded ? createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={handleClose}
    >
      <div 
        className="absolute inset-0 bg-[var(--pastel-lavender)]/30 backdrop-blur-md"
        style={{ position: 'absolute', inset: 0 }}
      />
      
      <div 
        className="relative glass rounded-3xl shadow-[var(--shadow-colorful)] overflow-hidden max-w-sm w-full mx-auto border-2 border-white/50"
        style={{ 
          animation: 'bookStackFadeIn 0.3s ease-out',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="px-5 py-4 flex items-center justify-between border-b-2 border-white/50"
          style={{ background: `linear-gradient(135deg, ${regionColor}20, ${regionColor}40)` }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-[var(--shadow-soft)]"
              style={{ backgroundColor: regionColor }}
            >
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-dark)] font-display">
                {bookCount} 本书
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] font-medium">
                {year < 0 ? `${Math.abs(year)} BC` : `${year} AD`}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/80 border-2 border-white text-[var(--text-muted)] hover:bg-[var(--pastel-pink)] hover:text-[var(--pastel-coral)] transition-all duration-200 shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 bg-gradient-to-b from-white/60 to-white/30">
          {bookCount > 1 && (
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handlePrev}
                className="p-2 hover:bg-[var(--pastel-pink)] rounded-xl transition-all duration-200 border-2 border-transparent hover:border-[var(--pastel-coral)] hover:text-[var(--pastel-coral)]"
              >
                <ChevronLeft className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
              <span className="text-xs font-bold text-[var(--text-muted)] bg-white/60 px-3 py-1 rounded-full">
                {currentIndex + 1} / {bookCount}
              </span>
              <button
                onClick={handleNext}
                className="p-2 hover:bg-[var(--pastel-pink)] rounded-xl transition-all duration-200 border-2 border-transparent hover:border-[var(--pastel-coral)] hover:text-[var(--pastel-coral)]"
              >
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
            </div>
          )}

          <div className="flex justify-center mb-5">
            <BookCard book={sortedBooks[currentIndex]} />
          </div>

          {bookCount > 1 && (
            <div className="flex gap-2 justify-center mb-5 overflow-x-auto py-2">
              {sortedBooks.map((book, index) => (
                <button
                  key={book.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`flex-shrink-0 w-10 h-14 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                    index === currentIndex 
                      ? 'border-[var(--pastel-coral)] ring-2 ring-[var(--pastel-coral)]/30 scale-110' 
                      : 'border-white/60 opacity-60 hover:opacity-90 hover:scale-105'
                  }`}
                >
                  {book.coverImage ? (
                    <img 
                      src={processDoubanImage(book.coverImage)} 
                      alt={book.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center text-[9px] text-white font-bold"
                      style={{ backgroundColor: regionColor }}
                    >
                      {book.title.slice(0, 2)}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={handleAddClick}
            className="w-full py-3 bg-gradient-to-r from-[var(--pastel-coral)] to-[var(--pastel-coral-light)] text-white rounded-2xl text-sm font-bold hover:shadow-[var(--shadow-colorful)] hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            在此位置添加书籍
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <div 
        className="relative cursor-pointer group"
        onClick={handleStackClick}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {bookCount > 1 && (
          <>
            <div 
              className="absolute w-28 h-20 glass rounded-2xl opacity-60 border-2 border-white/60"
              style={{ 
                transform: 'rotate(3deg) translateY(-4px)',
                background: `linear-gradient(135deg, ${regionColor}30, ${regionColor}10)`
              }}
            />
            {bookCount > 2 && (
              <div 
                className="absolute w-28 h-20 glass rounded-2xl opacity-40 border-2 border-white/40"
                style={{ 
                  transform: 'rotate(-2deg) translateY(-8px)',
                  background: `linear-gradient(135deg, ${regionColor}20, ${regionColor}5)`
                }}
              />
            )}
          </>
        )}
        
        <div className="relative z-10">
          <BookCard book={sortedBooks[0]} />
        </div>

        <div 
          className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-[var(--shadow-soft)] z-20 border-2 border-white"
          style={{ backgroundColor: regionColor }}
        >
          {bookCount}
        </div>

        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none">
          <span className="text-[11px] text-[var(--text-dark)] bg-white/90 px-3 py-1.5 rounded-full shadow-[var(--shadow-soft)] border border-[var(--border-light)] font-medium">
            点击查看 {bookCount} 本书
          </span>
        </div>
      </div>

      {expandedModal}
    </>
  );
}
