import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { BookNote, Tag, BookRelation, TimelineEvent, SearchFilters } from '../types';
import { useAuthStore } from './useAuthStore';
import type { Database } from '../types/supabase';

type NoteRow = Database['public']['Tables']['book_notes']['Row'];
type NoteInsert = Database['public']['Tables']['book_notes']['Insert'];
type TagRow = Database['public']['Tables']['tags']['Row'];
type TagInsert = Database['public']['Tables']['tags']['Insert'];
type RelationRow = Database['public']['Tables']['book_relations']['Row'];
type RelationInsert = Database['public']['Tables']['book_relations']['Insert'];
type EventRow = Database['public']['Tables']['timeline_events']['Row'];
type EventInsert = Database['public']['Tables']['timeline_events']['Insert'];

interface KnowledgeStore {
  // Data
  notes: BookNote[];
  tags: Tag[];
  relations: BookRelation[];
  events: TimelineEvent[];
  
  // UI State
  selectedNote: BookNote | null;
  selectedEvent: TimelineEvent | null;
  isNoteModalOpen: boolean;
  isEventModalOpen: boolean;
  editingNote: BookNote | null;
  editingEvent: TimelineEvent | null;
  searchFilters: SearchFilters;
  isLoading: boolean;
  error: string | null;
  
  // Actions - Notes
  setNotes: (notes: BookNote[]) => void;
  fetchNotes: () => Promise<void>;
  addNote: (note: Omit<BookNote, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateNote: (id: string, updates: Partial<BookNote>) => Promise<boolean>;
  deleteNote: (id: string) => Promise<boolean>;
  selectNote: (note: BookNote | null) => void;
  getNotesByBookId: (bookId: string) => BookNote[];
  
  // Actions - Tags
  setTags: (tags: Tag[]) => void;
  fetchTags: () => Promise<void>;
  addTag: (tag: Omit<Tag, 'id' | 'createdAt'>) => Promise<boolean>;
  updateTag: (id: string, updates: Partial<Tag>) => Promise<boolean>;
  deleteTag: (id: string) => Promise<boolean>;
  getTagById: (id: string) => Tag | undefined;
  
  // Actions - Relations
  setRelations: (relations: BookRelation[]) => void;
  fetchRelations: () => Promise<void>;
  addRelation: (relation: Omit<BookRelation, 'id' | 'createdAt'>) => Promise<boolean>;
  updateRelation: (id: string, updates: Partial<BookRelation>) => Promise<boolean>;
  deleteRelation: (id: string) => Promise<boolean>;
  getRelationsByBookId: (bookId: string) => BookRelation[];
  getRelatedBooks: (bookId: string) => string[];
  
  // Actions - Events
  setEvents: (events: TimelineEvent[]) => void;
  fetchEvents: () => Promise<void>;
  addEvent: (event: Omit<TimelineEvent, 'id' | 'createdAt'>) => Promise<boolean>;
  updateEvent: (id: string, updates: Partial<TimelineEvent>) => Promise<boolean>;
  deleteEvent: (id: string) => Promise<boolean>;
  selectEvent: (event: TimelineEvent | null) => void;
  getEventsByYear: (year: number) => TimelineEvent[];
  getEventsByBookId: (bookId: string) => TimelineEvent[];
  
  // Actions - Search
  setSearchFilters: (filters: Partial<SearchFilters>) => void;
  resetSearchFilters: () => void;
  
  // Actions - UI
  setIsNoteModalOpen: (open: boolean) => void;
  setIsEventModalOpen: (open: boolean) => void;
  setEditingNote: (note: BookNote | null) => void;
  setEditingEvent: (event: TimelineEvent | null) => void;
  openNoteModal: (bookId?: string) => void;
  closeNoteModal: () => void;
  openEventModal: () => void;
  closeEventModal: () => void;
  clearError: () => void;
}

export const useKnowledgeStore = create<KnowledgeStore>()(
  persist(
    (set, get) => ({
      // Initial data - 首次加载为空，从云端获取
      notes: [],
      tags: [],
      relations: [],
      events: [],
      
      // UI State - 不持久化
      selectedNote: null,
      selectedEvent: null,
      isNoteModalOpen: false,
      isEventModalOpen: false,
      editingNote: null,
      editingEvent: null,
      searchFilters: {
        query: '',
        tags: [],
        regions: [],
      },
      isLoading: false,
      error: null,
      
      // ==================== Notes Actions ====================
      setNotes: (notes) => set({ notes }),
      
      fetchNotes: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('book_notes')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error fetching notes:', error);
            set({ error: error.message, isLoading: false });
            return;
          }

          const notes: BookNote[] = ((data || []) as NoteRow[]).map((item) => ({
            id: item.id,
            bookId: item.book_id,
            title: item.title,
            content: item.content,
            pageNumber: item.page_number || undefined,
            chapter: item.chapter || undefined,
            quote: item.quote || undefined,
            tags: item.tags || [],
            createdAt: new Date(item.created_at),
            updatedAt: new Date(item.updated_at),
          }));

          set({ notes, isLoading: false });
        } catch (error) {
          console.error('Error fetching notes:', error);
          set({ error: '获取笔记失败', isLoading: false });
        }
      },
      
      addNote: async (noteData) => {
        const user = useAuthStore.getState().user;
        if (!user) {
          set({ error: '请先登录' });
          return false;
        }

        set({ isLoading: true, error: null });
        try {
          const insertData: NoteInsert = {
            user_id: user.id,
            book_id: noteData.bookId,
            title: noteData.title,
            content: noteData.content,
            page_number: noteData.pageNumber,
            chapter: noteData.chapter,
            quote: noteData.quote,
            tags: noteData.tags,
          };
          const { data, error } = await supabase
            .from('book_notes')
            // @ts-expect-error - Supabase类型推断问题
            .insert(insertData)
            .select()
            .single();

          if (error) {
            console.error('Error adding note:', error);
            set({ error: error.message, isLoading: false });
            return false;
          }

          const resultData = data as NoteRow;
          const newNote: BookNote = {
            id: resultData.id,
            bookId: resultData.book_id,
            title: resultData.title,
            content: resultData.content,
            pageNumber: resultData.page_number || undefined,
            chapter: resultData.chapter || undefined,
            quote: resultData.quote || undefined,
            tags: resultData.tags || [],
            createdAt: new Date(resultData.created_at),
            updatedAt: new Date(resultData.updated_at),
          };

          set((state) => ({ 
            notes: [newNote, ...state.notes],
            isLoading: false 
          }));
          return true;
        } catch (error) {
          console.error('Error adding note:', error);
          set({ error: '添加笔记失败', isLoading: false });
          return false;
        }
      },
      
      updateNote: async (id, updates) => {
        const user = useAuthStore.getState().user;
        if (!user) {
          set({ error: '请先登录' });
          return false;
        }

        set({ isLoading: true, error: null });
        try {
          const updateData: Partial<NoteInsert> = {};
          if (updates.title !== undefined) updateData.title = updates.title;
          if (updates.content !== undefined) updateData.content = updates.content;
          if (updates.pageNumber !== undefined) updateData.page_number = updates.pageNumber;
          if (updates.chapter !== undefined) updateData.chapter = updates.chapter;
          if (updates.quote !== undefined) updateData.quote = updates.quote;
          if (updates.tags !== undefined) updateData.tags = updates.tags;

          const { data, error } = await supabase
            .from('book_notes')
            // @ts-expect-error - Supabase类型推断问题
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

          if (error) {
            console.error('Error updating note:', error);
            set({ error: error.message, isLoading: false });
            return false;
          }

          const resultData = data as NoteRow;
          const updatedNote: BookNote = {
            id: resultData.id,
            bookId: resultData.book_id,
            title: resultData.title,
            content: resultData.content,
            pageNumber: resultData.page_number || undefined,
            chapter: resultData.chapter || undefined,
            quote: resultData.quote || undefined,
            tags: resultData.tags || [],
            createdAt: new Date(resultData.created_at),
            updatedAt: new Date(resultData.updated_at),
          };

          set((state) => ({
            notes: state.notes.map((note) =>
              note.id === id ? updatedNote : note
            ),
            selectedNote: state.selectedNote?.id === id ? updatedNote : state.selectedNote,
            isLoading: false,
          }));
          return true;
        } catch (error) {
          console.error('Error updating note:', error);
          set({ error: '更新笔记失败', isLoading: false });
          return false;
        }
      },
      
      deleteNote: async (id) => {
        const user = useAuthStore.getState().user;
        if (!user) {
          set({ error: '请先登录' });
          return false;
        }

        set({ isLoading: true, error: null });
        try {
          const { error } = await supabase
            .from('book_notes')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) {
            console.error('Error deleting note:', error);
            set({ error: error.message, isLoading: false });
            return false;
          }

          set((state) => ({
            notes: state.notes.filter((note) => note.id !== id),
            selectedNote: state.selectedNote?.id === id ? null : state.selectedNote,
            isLoading: false,
          }));
          return true;
        } catch (error) {
          console.error('Error deleting note:', error);
          set({ error: '删除笔记失败', isLoading: false });
          return false;
        }
      },
      
      selectNote: (note) => set({ selectedNote: note }),
      
      getNotesByBookId: (bookId) => {
        return get().notes.filter((note) => note.bookId === bookId);
      },
      
      // ==================== Tags Actions ====================
      setTags: (tags) => set({ tags }),
      
      fetchTags: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('tags')
            .select('*')
            .eq('user_id', user.id)
            .order('name', { ascending: true });

          if (error) {
            console.error('Error fetching tags:', error);
            set({ error: error.message, isLoading: false });
            return;
          }

          const tags: Tag[] = ((data || []) as TagRow[]).map((item) => ({
            id: item.id,
            name: item.name,
            color: item.color,
            createdAt: new Date(item.created_at),
          }));

          set({ tags, isLoading: false });
        } catch (error) {
          console.error('Error fetching tags:', error);
          set({ error: '获取标签失败', isLoading: false });
        }
      },
      
      addTag: async (tagData) => {
        const user = useAuthStore.getState().user;
        if (!user) {
          set({ error: '请先登录' });
          return false;
        }

        set({ isLoading: true, error: null });
        try {
          const insertData: TagInsert = {
            user_id: user.id,
            name: tagData.name,
            color: tagData.color,
            description: tagData.description,
          };
          const { data, error } = await supabase
            .from('tags')
            // @ts-expect-error - Supabase类型推断问题
            .insert(insertData)
            .select()
            .single();

          if (error) {
            console.error('Error adding tag:', error);
            set({ error: error.message, isLoading: false });
            return false;
          }

          const resultData = data as TagRow;
          const newTag: Tag = {
            id: resultData.id,
            name: resultData.name,
            color: resultData.color,
            createdAt: new Date(resultData.created_at),
          };

          set((state) => ({ 
            tags: [...state.tags, newTag],
            isLoading: false 
          }));
          return true;
        } catch (error) {
          console.error('Error adding tag:', error);
          set({ error: '添加标签失败', isLoading: false });
          return false;
        }
      },
      
      updateTag: async (id, updates) => {
        const user = useAuthStore.getState().user;
        if (!user) {
          set({ error: '请先登录' });
          return false;
        }

        set({ isLoading: true, error: null });
        try {
          const updateData: Partial<TagInsert> = {};
          if (updates.name !== undefined) updateData.name = updates.name;
          if (updates.color !== undefined) updateData.color = updates.color;
          if (updates.description !== undefined) updateData.description = updates.description;

          const { error } = await supabase
            .from('tags')
            // @ts-expect-error - Supabase类型推断问题
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) {
            console.error('Error updating tag:', error);
            set({ error: error.message, isLoading: false });
            return false;
          }

          set((state) => ({
            tags: state.tags.map((tag) =>
              tag.id === id ? { ...tag, ...updates } : tag
            ),
            isLoading: false,
          }));
          return true;
        } catch (error) {
          console.error('Error updating tag:', error);
          set({ error: '更新标签失败', isLoading: false });
          return false;
        }
      },
      
      deleteTag: async (id) => {
        const user = useAuthStore.getState().user;
        if (!user) {
          set({ error: '请先登录' });
          return false;
        }

        set({ isLoading: true, error: null });
        try {
          const { error } = await supabase
            .from('tags')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) {
            console.error('Error deleting tag:', error);
            set({ error: error.message, isLoading: false });
            return false;
          }

          set((state) => ({
            tags: state.tags.filter((tag) => tag.id !== id),
            notes: state.notes.map((note) => ({
              ...note,
              tags: note.tags.filter((tagId) => tagId !== id),
            })),
            isLoading: false,
          }));
          return true;
        } catch (error) {
          console.error('Error deleting tag:', error);
          set({ error: '删除标签失败', isLoading: false });
          return false;
        }
      },
      
      getTagById: (id) => {
        return get().tags.find((tag) => tag.id === id);
      },
      
      // ==================== Relations Actions ====================
      setRelations: (relations) => set({ relations }),
      
      fetchRelations: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('book_relations')
            .select('*')
            .eq('user_id', user.id);

          if (error) {
            console.error('Error fetching relations:', error);
            set({ error: error.message, isLoading: false });
            return;
          }

          const relations: BookRelation[] = ((data || []) as RelationRow[]).map((item) => ({
            id: item.id,
            sourceBookId: item.source_book_id,
            targetBookId: item.target_book_id,
            relationType: item.relation_type as BookRelation['relationType'],
            description: item.description || undefined,
            createdAt: new Date(item.created_at),
          }));

          set({ relations, isLoading: false });
        } catch (error) {
          console.error('Error fetching relations:', error);
          set({ error: '获取关联失败', isLoading: false });
        }
      },
      
      addRelation: async (relationData) => {
        const user = useAuthStore.getState().user;
        if (!user) {
          set({ error: '请先登录' });
          return false;
        }

        set({ isLoading: true, error: null });
        try {
          const insertData: RelationInsert = {
            user_id: user.id,
            source_book_id: relationData.sourceBookId,
            target_book_id: relationData.targetBookId,
            relation_type: relationData.relationType,
            description: relationData.description,
          };
          const { data, error } = await supabase
            .from('book_relations')
            // @ts-expect-error - Supabase类型推断问题
            .insert(insertData)
            .select()
            .single();

          if (error) {
            console.error('Error adding relation:', error);
            set({ error: error.message, isLoading: false });
            return false;
          }

          const resultData = data as RelationRow;
          const newRelation: BookRelation = {
            id: resultData.id,
            sourceBookId: resultData.source_book_id,
            targetBookId: resultData.target_book_id,
            relationType: resultData.relation_type as BookRelation['relationType'],
            description: resultData.description || undefined,
            createdAt: new Date(resultData.created_at),
          };

          set((state) => ({ 
            relations: [...state.relations, newRelation],
            isLoading: false 
          }));
          return true;
        } catch (error) {
          console.error('Error adding relation:', error);
          set({ error: '添加关联失败', isLoading: false });
          return false;
        }
      },
      
      updateRelation: async (id, updates) => {
        const user = useAuthStore.getState().user;
        if (!user) {
          set({ error: '请先登录' });
          return false;
        }

        set({ isLoading: true, error: null });
        try {
          const updateData: Partial<RelationInsert> = {};
          if (updates.relationType !== undefined) updateData.relation_type = updates.relationType;
          if (updates.description !== undefined) updateData.description = updates.description;

          const { error } = await supabase
            .from('book_relations')
            // @ts-expect-error - Supabase类型推断问题
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) {
            console.error('Error updating relation:', error);
            set({ error: error.message, isLoading: false });
            return false;
          }

          set((state) => ({
            relations: state.relations.map((relation) =>
              relation.id === id ? { ...relation, ...updates } : relation
            ),
            isLoading: false,
          }));
          return true;
        } catch (error) {
          console.error('Error updating relation:', error);
          set({ error: '更新关联失败', isLoading: false });
          return false;
        }
      },
      
      deleteRelation: async (id) => {
        const user = useAuthStore.getState().user;
        if (!user) {
          set({ error: '请先登录' });
          return false;
        }

        set({ isLoading: true, error: null });
        try {
          const { error } = await supabase
            .from('book_relations')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) {
            console.error('Error deleting relation:', error);
            set({ error: error.message, isLoading: false });
            return false;
          }

          set((state) => ({
            relations: state.relations.filter((relation) => relation.id !== id),
            isLoading: false,
          }));
          return true;
        } catch (error) {
          console.error('Error deleting relation:', error);
          set({ error: '删除关联失败', isLoading: false });
          return false;
        }
      },
      
      getRelationsByBookId: (bookId) => {
        return get().relations.filter(
          (relation) => relation.sourceBookId === bookId || relation.targetBookId === bookId
        );
      },
      
      getRelatedBooks: (bookId) => {
        const relations = get().getRelationsByBookId(bookId);
        return relations.map((relation) =>
          relation.sourceBookId === bookId ? relation.targetBookId : relation.sourceBookId
        );
      },
      
      // ==================== Events Actions ====================
      setEvents: (events) => set({ events }),
      
      fetchEvents: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('timeline_events')
            .select('*')
            .eq('user_id', user.id)
            .order('year', { ascending: true });

          if (error) {
            console.error('Error fetching events:', error);
            set({ error: error.message, isLoading: false });
            return;
          }

          const events: TimelineEvent[] = ((data || []) as EventRow[]).map((item) => ({
            id: item.id,
            title: item.title,
            year: item.year,
            month: item.month || undefined,
            day: item.day || undefined,
            regions: item.regions || [],
            description: item.description || '',
            importance: item.importance,
            relatedBookIds: item.related_book_ids || [],
            relatedNoteIds: item.related_note_ids || [],
            createdAt: new Date(item.created_at),
          }));

          set({ events, isLoading: false });
        } catch (error) {
          console.error('Error fetching events:', error);
          set({ error: '获取事件失败', isLoading: false });
        }
      },
      
      addEvent: async (eventData) => {
        const user = useAuthStore.getState().user;
        if (!user) {
          set({ error: '请先登录' });
          return false;
        }

        set({ isLoading: true, error: null });
        try {
          const insertData: EventInsert = {
            user_id: user.id,
            title: eventData.title,
            year: eventData.year,
            month: eventData.month,
            day: eventData.day,
            regions: eventData.regions,
            description: eventData.description,
            importance: eventData.importance,
            related_book_ids: eventData.relatedBookIds,
            related_note_ids: eventData.relatedNoteIds,
          };
          const { data, error } = await supabase
            .from('timeline_events')
            // @ts-expect-error - Supabase类型推断问题
            .insert(insertData)
            .select()
            .single();

          if (error) {
            console.error('Error adding event:', error);
            set({ error: error.message, isLoading: false });
            return false;
          }

          const resultData = data as EventRow;
          const newEvent: TimelineEvent = {
            id: resultData.id,
            title: resultData.title,
            year: resultData.year,
            month: resultData.month || undefined,
            day: resultData.day || undefined,
            regions: resultData.regions || [],
            description: resultData.description || '',
            importance: resultData.importance,
            relatedBookIds: resultData.related_book_ids || [],
            relatedNoteIds: resultData.related_note_ids || [],
            createdAt: new Date(resultData.created_at),
          };

          set((state) => ({ 
            events: [...state.events, newEvent],
            isLoading: false 
          }));
          return true;
        } catch (error) {
          console.error('Error adding event:', error);
          set({ error: '添加事件失败', isLoading: false });
          return false;
        }
      },
      
      updateEvent: async (id, updates) => {
        const user = useAuthStore.getState().user;
        if (!user) {
          set({ error: '请先登录' });
          return false;
        }

        set({ isLoading: true, error: null });
        try {
          const updateData: Partial<EventInsert> = {};
          if (updates.title !== undefined) updateData.title = updates.title;
          if (updates.year !== undefined) updateData.year = updates.year;
          if (updates.month !== undefined) updateData.month = updates.month;
          if (updates.day !== undefined) updateData.day = updates.day;
          if (updates.regions !== undefined) updateData.regions = updates.regions;
          if (updates.description !== undefined) updateData.description = updates.description;
          if (updates.importance !== undefined) updateData.importance = updates.importance;
          if (updates.relatedBookIds !== undefined) updateData.related_book_ids = updates.relatedBookIds;
          if (updates.relatedNoteIds !== undefined) updateData.related_note_ids = updates.relatedNoteIds;

          const { data, error } = await supabase
            .from('timeline_events')
            // @ts-expect-error - Supabase类型推断问题
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

          if (error) {
            console.error('Error updating event:', error);
            set({ error: error.message, isLoading: false });
            return false;
          }

          const resultData = data as EventRow;
          const updatedEvent: TimelineEvent = {
            id: resultData.id,
            title: resultData.title,
            year: resultData.year,
            month: resultData.month || undefined,
            day: resultData.day || undefined,
            regions: resultData.regions || [],
            description: resultData.description || '',
            importance: resultData.importance,
            relatedBookIds: resultData.related_book_ids || [],
            relatedNoteIds: resultData.related_note_ids || [],
            createdAt: new Date(resultData.created_at),
          };

          set((state) => ({
            events: state.events.map((event) =>
              event.id === id ? updatedEvent : event
            ),
            selectedEvent: state.selectedEvent?.id === id ? updatedEvent : state.selectedEvent,
            isLoading: false,
          }));
          return true;
        } catch (error) {
          console.error('Error updating event:', error);
          set({ error: '更新事件失败', isLoading: false });
          return false;
        }
      },
      
      deleteEvent: async (id) => {
        const user = useAuthStore.getState().user;
        if (!user) {
          set({ error: '请先登录' });
          return false;
        }

        set({ isLoading: true, error: null });
        try {
          const { error } = await supabase
            .from('timeline_events')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) {
            console.error('Error deleting event:', error);
            set({ error: error.message, isLoading: false });
            return false;
          }

          set((state) => ({
            events: state.events.filter((event) => event.id !== id),
            selectedEvent: state.selectedEvent?.id === id ? null : state.selectedEvent,
            isLoading: false,
          }));
          return true;
        } catch (error) {
          console.error('Error deleting event:', error);
          set({ error: '删除事件失败', isLoading: false });
          return false;
        }
      },
      
      selectEvent: (event) => set({ selectedEvent: event }),
      
      getEventsByYear: (year) => {
        return get().events.filter((event) => event.year === year);
      },
      
      getEventsByBookId: (bookId) => {
        return get().events.filter((event) => event.relatedBookIds.includes(bookId));
      },
      
      // ==================== Search Actions ====================
      setSearchFilters: (filters) => {
        set((state) => ({
          searchFilters: { ...state.searchFilters, ...filters },
        }));
      },
      
      resetSearchFilters: () => {
        set({
          searchFilters: {
            query: '',
            tags: [],
            regions: [],
          },
        });
      },
      
      // ==================== UI Actions ====================
      setIsNoteModalOpen: (open) => set({ isNoteModalOpen: open }),
      setIsEventModalOpen: (open) => set({ isEventModalOpen: open }),
      setEditingNote: (note) => set({ editingNote: note }),
      setEditingEvent: (event) => set({ editingEvent: event }),
      clearError: () => set({ error: null }),
      
      openNoteModal: (bookId) => {
        set({
          isNoteModalOpen: true,
          editingNote: null,
        });
      },
      
      closeNoteModal: () => {
        set({
          isNoteModalOpen: false,
          editingNote: null,
        });
      },
      
      openEventModal: () => {
        set({
          isEventModalOpen: true,
          editingEvent: null,
        });
      },
      
      closeEventModal: () => {
        set({
          isEventModalOpen: false,
          editingEvent: null,
        });
      },
    }),
    {
      name: 'knowledge-storage', // localStorage 键名
      partialize: (state) => ({
        // 只持久化搜索过滤器，数据从云端获取
        searchFilters: state.searchFilters,
      }),
    }
  )
);
