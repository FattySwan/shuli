import { useRef, useState, useEffect, useCallback } from 'react';
import { useBookStore } from '../store/useBookStore';
import { regions } from '../data/regions';
import type { Book } from '../types';
import { BookStack } from './BookStack';
import { ZoomIn, ZoomOut, RotateCcw, Move, Plus } from 'lucide-react';

const ROW_HEIGHT = 80;
const YEAR_STEP = 10;

export function TimelineMatrix() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 });
  const [hoveredRegionIndex, setHoveredRegionIndex] = useState<number | null>(null);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const mousePositionRef = useRef({ x: 0, y: 0 });

  const {
    books,
    startYear,
    endYear,
    pixelsPerYear,
    zoomIn,
    zoomOut,
    resetZoom,
    setYearRange,
    openAddModal
  } = useBookStore();

  const yearRange = endYear - startYear;
  const totalWidth = yearRange * pixelsPerYear;

  const yearMarkers = [];
  for (let year = Math.ceil(startYear / YEAR_STEP) * YEAR_STEP; year <= endYear; year += YEAR_STEP) {
    yearMarkers.push(year);
  }

  const handleMainScroll = useCallback(() => {
    if (containerRef.current && sidebarRef.current) {
      sidebarRef.current.scrollTop = containerRef.current.scrollTop;
    }
  }, []);

  const handleSidebarScroll = useCallback(() => {
    if (containerRef.current && sidebarRef.current) {
      containerRef.current.scrollTop = sidebarRef.current.scrollTop;
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-book-stack]') || target.closest('[data-book-card]')) {
      return;
    }
    if (!containerRef.current) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      scrollLeft: containerRef.current.scrollLeft,
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const getMouseYear = useCallback(() => {
    if (!containerRef.current) return (startYear + endYear) / 2;
    const container = containerRef.current;
    const scrollLeft = container.scrollLeft;
    const mouseX = mousePositionRef.current.x;
    const absoluteX = scrollLeft + mouseX;
    return startYear + absoluteX / pixelsPerYear;
  }, [startYear, pixelsPerYear, endYear]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mousePositionRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    containerRef.current.scrollLeft = dragStart.scrollLeft - dx;
  }, [isDragging, dragStart]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      mousePositionRef.current = {
        x: mouseX,
        y: e.clientY - rect.top
      };

      const mouseYear = getMouseYear();
      const scrollLeft = containerRef.current.scrollLeft;
      const containerWidth = containerRef.current.clientWidth;

      let newScrollLeft: number | undefined;
      if (e.deltaY < 0) {
        newScrollLeft = zoomIn(mouseYear, scrollLeft, containerWidth);
      } else {
        newScrollLeft = zoomOut(mouseYear, scrollLeft, containerWidth);
      }

      if (newScrollLeft !== undefined) {
        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.scrollLeft = newScrollLeft;
          }
        });
      }
    }
  }, [zoomIn, zoomOut, getMouseYear]);

  const handleZoomIn = useCallback(() => {
    if (!containerRef.current) return;
    const mouseYear = getMouseYear();
    const scrollLeft = containerRef.current.scrollLeft;
    const containerWidth = containerRef.current.clientWidth;
    const newScrollLeft = zoomIn(mouseYear, scrollLeft, containerWidth);

    if (newScrollLeft !== undefined) {
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollLeft = newScrollLeft;
        }
      });
    }
  }, [zoomIn, getMouseYear]);

  const handleZoomOut = useCallback(() => {
    if (!containerRef.current) return;
    const mouseYear = getMouseYear();
    const scrollLeft = containerRef.current.scrollLeft;
    const containerWidth = containerRef.current.clientWidth;
    const newScrollLeft = zoomOut(mouseYear, scrollLeft, containerWidth);

    if (newScrollLeft !== undefined) {
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollLeft = newScrollLeft;
        }
      });
    }
  }, [zoomOut, getMouseYear]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const targetYear = 2000;
    const yearPosition = (targetYear - startYear) * pixelsPerYear;
    const containerWidth = container.clientWidth;
    const scrollPosition = yearPosition - containerWidth / 2;

    requestAnimationFrame(() => {
      if (containerRef.current) {
        containerRef.current.scrollLeft = Math.max(0, scrollPosition);
      }
    });
  }, []);

  const getScaleLabel = () => {
    const percentage = Math.round((pixelsPerYear / 10) * 100);
    return `${percentage}%`;
  };

  const handleCellClick = (year: number, regionId: string) => {
    openAddModal({
      publishYear: year,
      regions: [regionId]
    });
  };

  const handleCellMouseEnter = (year: number, regionIndex: number) => {
    setHoveredYear(year);
    setHoveredRegionIndex(regionIndex);
  };

  const handleCellMouseLeave = () => {
    setHoveredYear(null);
    setHoveredRegionIndex(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar - Pastel Style */}
      <div className="flex items-center justify-between px-6 py-4 glass border-b border-[var(--border-light)]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/80 rounded-2xl border border-[var(--border-light)] p-1.5 shadow-[var(--shadow-soft)]">
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-[var(--pastel-pink)] rounded-xl transition-all duration-300"
              title="缩小"
            >
              <ZoomOut className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
            <span className="text-xs font-semibold text-[var(--text-primary)] min-w-[48px] text-center font-[var(--font-display)]">
              {getScaleLabel()}
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-[var(--pastel-pink)] rounded-xl transition-all duration-300"
              title="放大"
            >
              <ZoomOut className="w-4 h-4 text-[var(--text-secondary)] rotate-45" />
            </button>
          </div>
          <button
            onClick={resetZoom}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--pastel-coral)] to-[var(--pastel-coral-light)] text-white text-xs font-semibold rounded-2xl shadow-[var(--shadow-colorful)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>重置</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] bg-white/60 px-4 py-2 rounded-full">
          <Move className="w-3.5 h-3.5" />
          <span>拖拽移动 · Ctrl+滚轮缩放</span>
        </div>

        <div className="text-xs font-semibold text-[var(--text-primary)] bg-white/60 px-4 py-2 rounded-full font-[var(--font-display)]">
          {startYear < 0 ? `${Math.abs(startYear)} BC` : `${startYear} AD`} - {endYear} AD
        </div>
      </div>

      {/* Matrix Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Region Sidebar */}
        <div
          ref={sidebarRef}
          className="w-48 glass border-r border-[var(--border-light)] flex-shrink-0 overflow-y-auto overflow-x-hidden"
          onScroll={handleSidebarScroll}
          style={{ minWidth: '192px' }}
        >
          <div className="sticky top-0 glass px-5 py-4 border-b border-[var(--border-light)] z-10">
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider font-[var(--font-display)]">地区</h3>
          </div>
          {regions.map((region, index) => {
            const bookCount = books.filter(book => book.region === region.id).length;
            return (
              <div
                key={region.id}
                className={`flex items-center justify-between px-5 transition-all duration-300 border-b border-[var(--border-light)] hover:bg-white/50 ${
                  hoveredRegionIndex === index ? 'bg-[var(--pastel-mint)]/50' : ''
                }`}
                style={{ height: `${ROW_HEIGHT}px` }}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: region.color }}
                  />
                  <span className="text-sm font-medium text-[var(--text-primary)] truncate">{region.name}</span>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                  bookCount > 0 
                    ? 'bg-[var(--pastel-coral)] text-white' 
                    : 'bg-[var(--border-light)] text-[var(--text-muted)]'
                }`}>
                  {bookCount}
                </span>
              </div>
            );
          })}
        </div>

        {/* Timeline Content */}
        <div
          ref={containerRef}
          className={`flex-1 overflow-x-auto overflow-y-auto ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onScroll={handleMainScroll}
        >
          <div
            className="relative min-h-full bg-white/40"
            style={{ width: `${totalWidth}px` }}
          >
            {/* Year Axis */}
            <div className="sticky top-0 h-14 glass border-b border-[var(--border-light)] z-20 flex">
              {yearMarkers.map((year) => (
                <div
                  key={year}
                  className={`absolute top-0 h-full flex flex-col items-center justify-center border-l transition-all duration-300 ${
                    hoveredYear === year ? 'bg-[var(--pastel-coral)]/20 border-[var(--pastel-coral)]' : 'border-[var(--border-light)]'
                  }`}
                  style={{ left: `${(year - startYear) * pixelsPerYear}px` }}
                >
                  <span className="text-xs font-bold text-[var(--text-secondary)] whitespace-nowrap px-3 font-[var(--font-display)]">
                    {year < 0 ? `${Math.abs(year)} BC` : year}
                  </span>
                </div>
              ))}
            </div>

            {/* Grid Lines */}
            <div className="absolute inset-0 pointer-events-none">
              {yearMarkers.map((year) => (
                <div
                  key={`grid-${year}`}
                  className={`absolute top-0 bottom-0 border-l transition-all duration-300 ${
                    hoveredYear === year ? 'bg-[var(--pastel-coral)]/10 border-[var(--pastel-coral)]/30' : 'border-[var(--border-light)]/50'
                  }`}
                  style={{
                    left: `${(year - startYear) * pixelsPerYear}px`,
                    width: `${YEAR_STEP * pixelsPerYear}px`
                  }}
                />
              ))}
              {regions.map((_, index) => (
                <div
                  key={`row-${index}`}
                  className={`absolute left-0 right-0 border-b transition-all duration-300 ${
                    hoveredRegionIndex === index ? 'bg-[var(--pastel-mint)]/20 border-[var(--pastel-mint)]' : 'border-[var(--border-light)]/30'
                  }`}
                  style={{
                    top: `${56 + index * ROW_HEIGHT}px`,
                    height: `${ROW_HEIGHT}px`
                  }}
                />
              ))}
            </div>

            {/* Grid Cells with Add Buttons */}
            {yearMarkers.map((year) => (
              regions.map((region, regionIndex) => {
                const cellWidth = YEAR_STEP * pixelsPerYear;
                const isHovered = hoveredYear === year && hoveredRegionIndex === regionIndex;

                return (
                  <div
                    key={`cell-${year}-${region.id}`}
                    className={`absolute group transition-all duration-300 ${
                      isHovered ? 'bg-[var(--pastel-coral)]/10' : ''
                    }`}
                    style={{
                      left: `${(year - startYear) * pixelsPerYear}px`,
                      top: `${56 + regionIndex * ROW_HEIGHT}px`,
                      width: `${cellWidth}px`,
                      height: `${ROW_HEIGHT}px`,
                    }}
                    onMouseEnter={() => handleCellMouseEnter(year, regionIndex)}
                    onMouseLeave={handleCellMouseLeave}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        onClick={() => handleCellClick(year, region.id)}
                        className="w-10 h-10 bg-gradient-to-br from-[var(--pastel-coral)] to-[var(--pastel-coral-light)] text-white rounded-full shadow-[var(--shadow-colorful)] opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 flex items-center justify-center z-10 hover:shadow-lg hover:-translate-y-1"
                        title={`在 ${region.name} ${year < 0 ? Math.abs(year) + ' BC' : year + ' AD'} 添加书籍`}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ))}

            {/* Book Stacks */}
            {(() => {
              const groupedBooks = new Map<string, Book[]>();

              books.forEach((book) => {
                const regionId = book.region;
                const key = `${book.year}-${regionId}`;
                if (!groupedBooks.has(key)) {
                  groupedBooks.set(key, []);
                }
                groupedBooks.get(key)!.push(book);
              });

              return Array.from(groupedBooks.entries()).map(([key, groupBooks]) => {
                const [yearStr, regionId] = key.split('-');
                const year = parseInt(yearStr);
                const regionIndex = regions.findIndex(r => r.id === regionId);

                if (regionIndex === -1) return null;

                const left = (year - startYear) * pixelsPerYear;
                const top = 56 + regionIndex * ROW_HEIGHT + 10;

                return (
                  <div
                    key={key}
                    className="absolute"
                    style={{
                      left: `${left}px`,
                      top: `${top}px`,
                    }}
                  >
                    <BookStack
                      books={groupBooks}
                      year={year}
                      regionId={regionId}
                    />
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
