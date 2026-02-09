export type BlogStatus = 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';
export type BlogVisibility = 'PUBLIC' | 'PRIVATE';

export type BlogDocType = 'PDF' | 'DOC' | 'DOCX' | 'FILE';

export interface BlogDocument {
  id: string;
  title: string;
  type: BlogDocType;
  url: string;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  status: BlogStatus;
  visibility: BlogVisibility;
  scheduledFor?: string; // datetime-local value
  coverImageUrl?: string;
  documents: BlogDocument[];
  views: number;
  likes: number;
  updatedAt: Date;
  authorName: string;
  readTimeMin: number;
}

export const BLOG_CATEGORIES = ['Cardiology', 'Patient Care', 'Health & Wellness', 'Nutrition', 'Lifestyle'] as const;

/**
 * TEMP: mock data until wired to API.
 * Keep this file UI-safe (no DOM access) so it can be imported by multiple pages.
 */
export const BLOGS_MOCK_POSTS: BlogPost[] = [
  {
    id: 'b1',
    title: 'Managing Type 2 Diabetes Through Modern Nutrition',
    content:
      'Type 2 diabetes is a chronic condition that affects the way your body metabolizes sugar (glucose)...\n\nIn this post we’ll discuss meal timing, fiber, protein, and practical swaps that work in real life.',
    category: 'Health & Wellness',
    tags: ['Diabetes', 'Diet'],
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    coverImageUrl: 'assets/avatars/default-avatar.jpg',
    documents: [
      {
        id: 'd1',
        title: 'Health Check-up Guidelines',
        type: 'PDF',
        url: 'assets/avatars/default-avatar.jpg'
      }
    ],
    views: 1200,
    likes: 84,
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    authorName: 'Dr. Sarah Smith',
    readTimeMin: 5
  },
  {
    id: 'b2',
    title: 'Dietary Management for Hypertension',
    content:
      'Blood pressure responds to lifestyle changes faster than most people expect.\n\nWe’ll cover DASH basics, sodium awareness, and how to build a heart-friendly plate.',
    category: 'Patient Care',
    tags: ['Heart Health', 'Blood Pressure'],
    status: 'DRAFT',
    visibility: 'PRIVATE',
    coverImageUrl: 'assets/avatars/default-avatar.jpg',
    documents: [],
    views: 856,
    likes: 42,
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    authorName: 'Dr. Sarah Smith',
    readTimeMin: 4
  }
];

