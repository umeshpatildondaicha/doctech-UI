import { Component, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AppButtonComponent, DividerComponent, IconComponent, PageBodyDirective, PageComponent } from '@lk/core';

type BlogStatus = 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';
type BlogVisibility = 'PUBLIC' | 'PRIVATE';

type BlogDocType = 'PDF' | 'DOC' | 'DOCX' | 'FILE';

interface BlogDocument {
  id: string;
  title: string;
  type: BlogDocType;
  url: string;
}

interface BlogPost {
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

@Component({
  selector: 'app-blogs',
  standalone: true,
  imports: [CommonModule, FormsModule, PageComponent, PageBodyDirective, IconComponent, DividerComponent, AppButtonComponent],
  templateUrl: './blogs.component.html',
  styleUrl: './blogs.component.scss'
})
export class BlogsComponent {
  private readonly sanitizer = inject(DomSanitizer);

  // Left panel
  listFilter: 'ALL' | 'PUBLISHED' | 'DRAFTS' | 'SCHEDULED' = 'ALL';
  listSearch = '';

  // Center panel
  editorMode: 'edit' | 'preview' = 'edit';
  editStep: 1 | 2 = 1; // 1 = Media & options, 2 = Content
  isMobile = window.innerWidth < 768;
  isContentExpanded = false;

  // Data (mock for now; wire to API later)
  posts: BlogPost[] = [
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

  selectedPostId: string | null = this.posts[0]?.id ?? null;
  tagInput = '';

  categories = ['Cardiology', 'Patient Care', 'Health & Wellness', 'Nutrition', 'Lifestyle'];

  get selectedPost(): BlogPost | null {
    return this.posts.find(p => p.id === this.selectedPostId) ?? null;
  }

  get filteredPosts(): BlogPost[] {
    const q = this.listSearch.trim().toLowerCase();
    return this.posts
      .filter(p => {
        if (this.listFilter === 'PUBLISHED' && p.status !== 'PUBLISHED') return false;
        if (this.listFilter === 'DRAFTS' && p.status !== 'DRAFT') return false;
        if (this.listFilter === 'SCHEDULED' && p.status !== 'SCHEDULED') return false;
        return true;
      })
      .filter(p => {
        if (!q) return true;
        return (
          p.title.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.tags.some(t => t.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  createNewPost(): void {
    this.editStep = 1;
    const now = new Date();
    const newPost: BlogPost = {
      id: `b_${Date.now()}`,
      title: 'Untitled Article',
      content: '',
      category: 'Health & Wellness',
      tags: [],
      status: 'DRAFT',
      visibility: 'PRIVATE',
      coverImageUrl: '',
      documents: [],
      views: 0,
      likes: 0,
      updatedAt: now,
      authorName: 'Dr. Sarah Smith',
      readTimeMin: 3
    };
    this.posts = [newPost, ...this.posts];
    this.selectedPostId = newPost.id;
    this.editorMode = 'edit';
    this.isContentExpanded = false;
  }

  selectPost(post: BlogPost): void {
    this.selectedPostId = post.id;
    this.editorMode = 'edit';
    this.editStep = 1;
    this.isContentExpanded = false;
  }

  setEditStep(step: 1 | 2): void {
    this.editStep = step;
    if (step === 2) setTimeout(() => this.loadContentIntoEditor(), 0);
  }

  @ViewChild('contentInput') contentInputRef?: ElementRef<HTMLDivElement>;

  /** Load post content into contenteditable when entering step 2 */
  loadContentIntoEditor(): void {
    const el = this.contentInputRef?.nativeElement;
    const p = this.selectedPost;
    if (!el || !p) return;
    el.innerHTML = p.content || '';
  }

  /** Sync contenteditable content to model */
  onContentInput(): void {
    const el = this.contentInputRef?.nativeElement;
    const p = this.selectedPost;
    if (el && p) p.content = el.innerHTML;
  }

  /** Apply formatting via execCommand (keeps selection when button is clicked via mousedown) */
  formatBold(): void {
    this.focusEditorAndExec('bold');
  }

  formatItalic(): void {
    this.focusEditorAndExec('italic');
  }

  formatBulletList(): void {
    this.focusEditorAndExec('insertUnorderedList');
  }

  formatNumberedList(): void {
    this.focusEditorAndExec('insertOrderedList');
  }

  private focusEditorAndExec(command: string): void {
    const el = this.contentInputRef?.nativeElement;
    const p = this.selectedPost;
    if (!el || !p) return;
    el.focus();
    document.execCommand(command, false);
    p.content = el.innerHTML;
  }

  /** For preview: render stored HTML safely */
  getSafeContent(): SafeHtml {
    const p = this.selectedPost;
    const html = p?.content ?? '';
    return html ? this.sanitizer.bypassSecurityTrustHtml(html) : this.sanitizer.bypassSecurityTrustHtml('');
  }

  saveDraft(): void {
    const p = this.selectedPost;
    if (!p) return;
    p.status = 'DRAFT';
    p.updatedAt = new Date();
  }

  publish(): void {
    const p = this.selectedPost;
    if (!p) return;
    p.status = 'PUBLISHED';
    p.updatedAt = new Date();
  }

  duplicateSelectedPost(): void {
    const p = this.selectedPost;
    if (!p) return;
    const now = new Date();
    const copy: BlogPost = {
      ...p,
      id: `b_${Date.now()}`,
      title: `${p.title} (Copy)`,
      status: 'DRAFT',
      views: 0,
      likes: 0,
      updatedAt: now
    };
    this.posts = [copy, ...this.posts];
    this.selectedPostId = copy.id;
    this.editorMode = 'edit';
  }

  deleteSelectedPost(): void {
    const p = this.selectedPost;
    if (!p) return;
    this.posts = this.posts.filter(x => x.id !== p.id);
    this.selectedPostId = this.posts[0]?.id ?? null;
    this.editorMode = 'edit';
  }

  setEditorMode(mode: 'edit' | 'preview'): void {
    this.editorMode = mode;
  }

  toggleContentExpanded(): void {
    this.isContentExpanded = !this.isContentExpanded;
  }

  onDocSelected(ev: Event): void {
    const p = this.selectedPost;
    if (!p) return;
    const input = ev.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (files.length === 0) return;

    const docs: BlogDocument[] = files.map((f) => ({
      id: `doc_${Date.now()}_${f.name}`,
      title: f.name,
      type: this.getDocTypeFromName(f.name),
      url: URL.createObjectURL(f)
    }));

    p.documents = [...p.documents, ...docs];
    p.updatedAt = new Date();
    input.value = '';
  }

  removeDoc(docId: string): void {
    const p = this.selectedPost;
    if (!p) return;
    p.documents = p.documents.filter(d => d.id !== docId);
    p.updatedAt = new Date();
  }

  private getDocTypeFromName(name: string): BlogDocType {
    const n = (name || '').toLowerCase();
    if (n.endsWith('.pdf')) return 'PDF';
    if (n.endsWith('.docx')) return 'DOCX';
    if (n.endsWith('.doc')) return 'DOC';
    return 'FILE';
  }

  getDocIcon(type: BlogDocType): string {
    switch (type) {
      case 'PDF': return 'picture_as_pdf';
      case 'DOC':
      case 'DOCX': return 'description';
      default: return 'attach_file';
    }
  }

  onCoverSelected(ev: Event): void {
    const p = this.selectedPost;
    if (!p) return;
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    p.coverImageUrl = URL.createObjectURL(file);
    p.updatedAt = new Date();
    input.value = '';
  }

  addTagFromInput(): void {
    const p = this.selectedPost;
    const v = this.tagInput.trim();
    if (!p || !v) return;
    if (!p.tags.includes(v)) p.tags = [...p.tags, v];
    this.tagInput = '';
  }

  removeTag(tag: string): void {
    const p = this.selectedPost;
    if (!p) return;
    p.tags = p.tags.filter(t => t !== tag);
  }

  formatTimeAgo(d: Date): string {
    const diff = Date.now() - d.getTime();
    const min = Math.floor(diff / 60000);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    return `${day}d ago`;
  }

  formatDateShort(d: Date): string {
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  }
}

