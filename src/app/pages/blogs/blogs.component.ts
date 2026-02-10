import { AfterViewInit, Component, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { AppButtonComponent, DividerComponent, IconComponent, PageBodyDirective, PageComponent } from '@lk/core';
import { BLOGS_MOCK_POSTS, BLOG_CATEGORIES, BlogDocType, BlogDocument, BlogPost } from './blogs.data';

@Component({
  selector: 'app-blogs',
  standalone: true,
  imports: [CommonModule, FormsModule, PageComponent, PageBodyDirective, IconComponent, DividerComponent, AppButtonComponent],
  templateUrl: './blogs.component.html',
  styleUrl: './blogs.component.scss'
})
export class BlogsComponent implements AfterViewInit {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Left panel
  listFilter: 'ALL' | 'PUBLISHED' | 'DRAFTS' | 'SCHEDULED' = 'ALL';
  listSearch = '';

  isMobile = window.innerWidth < 768;
  isContentExpanded = false;

  // Data (mock for now; wire to API later)
  posts: BlogPost[] = [...BLOGS_MOCK_POSTS];

  selectedPostId: string | null = this.posts[0]?.id ?? null;
  tagInput = '';

  categories = [...BLOG_CATEGORIES];

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    const openId = qp.get('id');
    const createNew = qp.get('new') === '1' || qp.get('new') === 'true';

    if (createNew) {
      this.createNewPost();
      // clear query param so refresh doesn't keep creating posts
      void this.router.navigate([], { queryParams: { new: null, id: null }, queryParamsHandling: 'merge' });
      return;
    }

    if (openId && this.posts.some(p => p.id === openId)) {
      this.selectedPostId = openId;
      // clear id param so refresh doesn't keep forcing selection
      void this.router.navigate([], { queryParams: { id: null }, queryParamsHandling: 'merge' });
    }
  }

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
    this.isContentExpanded = false;
    setTimeout(() => this.loadContentIntoEditor(), 0);
  }

  selectPost(post: BlogPost): void {
    this.selectedPostId = post.id;
    this.isContentExpanded = false;
    setTimeout(() => this.loadContentIntoEditor(), 0);
  }

  @ViewChild('contentInput') contentInputRef?: ElementRef<HTMLDivElement>;

  ngAfterViewInit(): void {
    setTimeout(() => this.loadContentIntoEditor(), 0);
  }

  /** Load post content into contenteditable */
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
    setTimeout(() => this.loadContentIntoEditor(), 0);
  }

  deleteSelectedPost(): void {
    const p = this.selectedPost;
    if (!p) return;
    this.posts = this.posts.filter(x => x.id !== p.id);
    this.selectedPostId = this.posts[0]?.id ?? null;
    setTimeout(() => this.loadContentIntoEditor(), 0);
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

