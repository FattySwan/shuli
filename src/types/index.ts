export interface Book {
  id: string;
  title: string;
  author: string;
  year: number;
  region: string;
  description?: string;
  coverImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookNote {
  id: string;
  bookId: string;
  title: string;
  content: string;
  pageNumber?: number;
  chapter?: string;
  quote?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: Date;
}

export interface BookRelation {
  id: string;
  sourceBookId: string;
  targetBookId: string;
  relationType: 'influences' | 'continues' | 'contrasts' | 'references' | 'inspired_by' | 'custom';
  description?: string;
  createdAt: Date;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  year: number;
  month?: number;
  day?: number;
  regions: string[];
  relatedBookIds: string[];
  relatedNoteIds: string[];
  importance: 'low' | 'medium' | 'high';
  createdAt: Date;
}

export interface Region {
  id: string;
  name: string;
  code: string;
  color: string;
  parentId?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export type ViewScale = 'year' | '5years' | '10years' | 'century';
export type ViewMode = 'timeline' | 'graph';

export interface TimelineState {
  scale: ViewScale;
  startYear: number;
  endYear: number;
  pixelsPerYear: number;
}

export interface GraphState {
  selectedTagIds: string[];
  selectedRegionIds: string[];
  layout: 'force' | 'hierarchical' | 'circular';
}

export interface SearchFilters {
  query: string;
  tags: string[];
  regions: string[];
  status?: 'read' | 'reading' | 'want';
  yearRange?: { start: number; end: number };
}
