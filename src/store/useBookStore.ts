import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { Book } from '../types';
import { useAuthStore } from './useAuthStore';
import type { Database } from '../types/supabase';

type BookRow = Database['public']['Tables']['books']['Row'];
type BookInsert = Database['public']['Tables']['books']['Insert'];

interface PrefillData {
  publishYear?: number;
  regions?: string[];
}

// 用于添加书籍的数据类型（不包含 id 和时间戳）
interface AddBookData {
  title: string;
  author: string;
  year: number;
  region: string;
  description?: string;
  coverImage?: string;
}

interface BookStore {
  books: Book[];
  selectedBook: Book | null;
  startYear: number;
  endYear: number;
  pixelsPerYear: number;
  isAddModalOpen: boolean;
  editingBook: Book | null;
  prefillData: PrefillData | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setBooks: (books: Book[]) => void;
  fetchBooks: () => Promise<void>;
  addBook: (book: AddBookData) => Promise<boolean>;
  updateBook: (id: string, updates: Partial<AddBookData>) => Promise<boolean>;
  deleteBook: (id: string) => Promise<boolean>;
  selectBook: (book: Book | null) => void;
  setPixelsPerYear: (pixels: number, centerYear?: number, containerScrollLeft?: number, containerWidth?: number) => number | undefined;
  zoomIn: (centerYear?: number, containerScrollLeft?: number, containerWidth?: number) => number | undefined;
  zoomOut: (centerYear?: number, containerScrollLeft?: number, containerWidth?: number) => number | undefined;
  resetZoom: () => void;
  setYearRange: (start: number, end: number) => void;
  setIsAddModalOpen: (open: boolean) => void;
  setEditingBook: (book: Book | null) => void;
  setPrefillData: (data: PrefillData | null) => void;
  openAddModal: (prefill?: PrefillData) => void;
  closeAddModal: () => void;
  clearError: () => void;
}

// 缩放配置 - 连续缩放
const MIN_PIXELS_PER_YEAR = 2;
const MAX_PIXELS_PER_YEAR = 200;
const ZOOM_STEP = 1.2; // 每次缩放的比例

export const useBookStore = create<BookStore>()(
  persist(
    (set, get) => ({
      books: [],
      selectedBook: null,
      startYear: -500,
      endYear: 2050,
      pixelsPerYear: 20,
      isAddModalOpen: false,
      editingBook: null,
      prefillData: null,
      isLoading: false,
      error: null,

      setBooks: (books) => set({ books }),

      fetchBooks: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('books')
            .select('*')
            .eq('user_id', user.id)
            .order('year', { ascending: true });

          if (error) {
            console.error('Error fetching books:', error);
            set({ error: error.message, isLoading: false });
            return;
          }

          // 转换数据格式
          const books: Book[] = ((data || []) as BookRow[]).map((item) => ({
            id: item.id,
            title: item.title,
            author: item.author,
            year: item.year,
            region: item.region,
            description: item.description || '',
            coverImage: item.cover_image || '',
            createdAt: new Date(item.created_at),
            updatedAt: new Date(item.updated_at),
          }));

          set({ books, isLoading: false });
        } catch (error) {
          console.error('Error fetching books:', error);
          set({ error: '获取书籍失败', isLoading: false });
        }
      },

      addBook: async (bookData) => {
        const user = useAuthStore.getState().user;
        if (!user) {
          set({ error: '请先登录' });
          return false;
        }

        set({ isLoading: true, error: null });
        try {
          const insertData: BookInsert = {
            user_id: user.id,
            title: bookData.title,
            author: bookData.author,
            year: bookData.year,
            region: bookData.region,
            description: bookData.description,
            cover_image: bookData.coverImage,
          };
          const { data, error } = await supabase
            .from('books')
            // @ts-expect-error - Supabase类型推断问题
            .insert(insertData)
            .select()
            .single();

          if (error) {
            console.error('Error adding book:', error);
            set({ error: error.message, isLoading: false });
            return false;
          }

          const resultData = data as BookRow;
          const newBook: Book = {
            id: resultData.id,
            title: resultData.title,
            author: resultData.author,
            year: resultData.year,
            region: resultData.region,
            description: resultData.description || '',
            coverImage: resultData.cover_image || '',
            createdAt: new Date(resultData.created_at),
            updatedAt: new Date(resultData.updated_at),
          };

          set((state) => ({ 
            books: [...state.books, newBook],
            isLoading: false 
          }));
          return true;
        } catch (error) {
          console.error('Error adding book:', error);
          set({ error: '添加书籍失败', isLoading: false });
          return false;
        }
      },

      updateBook: async (id, updates) => {
        const user = useAuthStore.getState().user;
        if (!user) {
          set({ error: '请先登录' });
          return false;
        }

        set({ isLoading: true, error: null });
        try {
          const updateData: Partial<BookInsert> = {};
          if (updates.title !== undefined) updateData.title = updates.title;
          if (updates.author !== undefined) updateData.author = updates.author;
          if (updates.year !== undefined) updateData.year = updates.year;
          if (updates.region !== undefined) updateData.region = updates.region;
          if (updates.description !== undefined) updateData.description = updates.description;
          if (updates.coverImage !== undefined) updateData.cover_image = updates.coverImage;

          const { data, error } = await supabase
            .from('books')
            // @ts-expect-error - Supabase类型推断问题
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

          if (error) {
            console.error('Error updating book:', error);
            set({ error: error.message, isLoading: false });
            return false;
          }

          const resultData = data as BookRow;
          const updatedBook: Book = {
            id: resultData.id,
            title: resultData.title,
            author: resultData.author,
            year: resultData.year,
            region: resultData.region,
            description: resultData.description || '',
            coverImage: resultData.cover_image || '',
            createdAt: new Date(resultData.created_at),
            updatedAt: new Date(resultData.updated_at),
          };

          set((state) => ({
            books: state.books.map((book) =>
              book.id === id ? updatedBook : book
            ),
            selectedBook: state.selectedBook?.id === id ? updatedBook : state.selectedBook,
            isLoading: false,
          }));
          return true;
        } catch (error) {
          console.error('Error updating book:', error);
          set({ error: '更新书籍失败', isLoading: false });
          return false;
        }
      },

      deleteBook: async (id) => {
        const user = useAuthStore.getState().user;
        if (!user) {
          set({ error: '请先登录' });
          return false;
        }

        set({ isLoading: true, error: null });
        try {
          const { error } = await supabase
            .from('books')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) {
            console.error('Error deleting book:', error);
            set({ error: error.message, isLoading: false });
            return false;
          }

          set((state) => ({
            books: state.books.filter((book) => book.id !== id),
            selectedBook: state.selectedBook?.id === id ? null : state.selectedBook,
            isLoading: false,
          }));
          return true;
        } catch (error) {
          console.error('Error deleting book:', error);
          set({ error: '删除书籍失败', isLoading: false });
          return false;
        }
      },

      selectBook: (book) => set({ selectedBook: book }),

      setPixelsPerYear: (pixels, centerYear, containerScrollLeft?, containerWidth?) => {
        const state = get();
        const clampedPixels = Math.max(MIN_PIXELS_PER_YEAR, Math.min(MAX_PIXELS_PER_YEAR, pixels));
        
        if (centerYear !== undefined && containerScrollLeft !== undefined && containerWidth !== undefined) {
          // 以 centerYear 为中心进行缩放
          // 计算鼠标位置相对于容器左边缘的距离
          const mouseX = (centerYear - state.startYear) * state.pixelsPerYear - containerScrollLeft;
          
          // 新的 pixelsPerYear
          const newPixelsPerYear = clampedPixels;
          
          // 计算缩放后，centerYear 应该在的位置
          const newCenterX = (centerYear - state.startYear) * newPixelsPerYear;
          
          // 计算需要调整的滚动位置，使 centerYear 保持在鼠标位置
          const newScrollLeft = newCenterX - mouseX;
          
          set({ 
            pixelsPerYear: newPixelsPerYear,
          });
          
          return newScrollLeft;
        } else {
          set({ pixelsPerYear: clampedPixels });
          return undefined;
        }
      },

      zoomIn: (centerYear, containerScrollLeft, containerWidth) => {
        const currentPixels = get().pixelsPerYear;
        const newPixels = Math.min(MAX_PIXELS_PER_YEAR, currentPixels * ZOOM_STEP);
        return get().setPixelsPerYear(newPixels, centerYear, containerScrollLeft, containerWidth);
      },

      zoomOut: (centerYear, containerScrollLeft, containerWidth) => {
        const currentPixels = get().pixelsPerYear;
        const newPixels = Math.max(MIN_PIXELS_PER_YEAR, currentPixels / ZOOM_STEP);
        return get().setPixelsPerYear(newPixels, centerYear, containerScrollLeft, containerWidth);
      },

      resetZoom: () => {
        set({ pixelsPerYear: 20, startYear: -500, endYear: 2050 });
      },

      setYearRange: (start, end) => set({ startYear: start, endYear: end }),

      setIsAddModalOpen: (open) => set({ isAddModalOpen: open }),
      setEditingBook: (book) => set({ editingBook: book }),
      setPrefillData: (data) => set({ prefillData: data }),
      clearError: () => set({ error: null }),
      
      openAddModal: (prefill) => {
        set({ 
          isAddModalOpen: true, 
          editingBook: null,
          prefillData: prefill || null 
        });
      },
      
      closeAddModal: () => {
        set({ 
          isAddModalOpen: false, 
          editingBook: null,
          prefillData: null 
        });
      },
    }),
    {
      name: 'book-storage', // localStorage 键名
      partialize: (state) => ({
        // 只持久化时间轴配置，不持久化书籍数据（从云端获取）
        startYear: state.startYear,
        endYear: state.endYear,
        pixelsPerYear: state.pixelsPerYear,
      }),
    }
  )
);
