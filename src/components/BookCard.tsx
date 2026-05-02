import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Book } from '../types';
import { useBookStore } from '../store/useBookStore';
import { getRegionColor } from '../data/regions';
import { BookOpen } from 'lucide-react';
import { processDoubanImage } from '../lib/imageProxy';

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const { setEditingBook, setIsAddModalOpen } = useBookStore();

  const regionColor = getRegionColor(book.region);

  const handleClick = () => {
    navigate(`/book/${book.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBook(book);
    setIsAddModalOpen(true);
  };

  return (
    <div
      className="relative group"
      data-book-card="true"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        onClick={handleClick}
        className={`
          relative w-28 glass rounded-2xl overflow-hidden
          transition-all duration-300 ease-out cursor-pointer border-2
          ${isHovered ? 'shadow-[var(--shadow-colorful)] scale-[1.03] z-10 -translate-y-1' : 'shadow-[var(--shadow-soft)]'}
        `}
        style={{
          borderColor: regionColor,
        }}
      >
        {/* Cover Image */}
        <div className="relative h-16 overflow-hidden bg-gradient-to-br from-[var(--pastel-pink)] to-[var(--pastel-lavender)]">
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
            <div className="flex items-center justify-center h-full text-[var(--pastel-coral)]">
              <BookOpen className="w-6 h-6" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-2.5 bg-white/80">
          <h4 className="text-[11px] font-bold text-[var(--text-dark)] line-clamp-2 leading-tight mb-0.5 font-display">
            {book.title}
          </h4>
          <p className="text-[10px] text-[var(--text-muted)] truncate">
            {book.author}
          </p>
        </div>

        {/* Year Badge */}
        <div 
          className="absolute bottom-0 right-0 px-2 py-0.5 text-[9px] font-bold text-white rounded-tl-xl"
          style={{ backgroundColor: regionColor }}
        >
          {book.year < 0 ? `${Math.abs(book.year)} BC` : book.year}
        </div>
      </div>

      {/* Hover Actions */}
      {isHovered && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1">
          <button
            onClick={handleEdit}
            className="px-3 py-1.5 bg-[var(--text-dark)] text-[10px] font-semibold text-white rounded-full shadow-[var(--shadow-soft)] hover:bg-[var(--pastel-coral)] transition-all duration-200"
          >
            编辑
          </button>
        </div>
      )}
    </div>
  );
}
