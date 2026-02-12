import { AfterViewInit, Component, OnInit, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { AppButtonComponent, DividerComponent, IconComponent, PageBodyDirective, PageComponent } from '@lk/core';
import { BLOG_CATEGORIES, BlogDocType, BlogDocument, BlogPost } from './blogs.data';
import { finalize } from 'rxjs';
import { BlogService } from '../../services/blog.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-blogs',
  standalone: true,
  imports: [CommonModule, FormsModule, PageComponent, PageBodyDirective, IconComponent, DividerComponent, AppButtonComponent],
  templateUrl: './blogs.component.html',
  styleUrl: './blogs.component.scss'
})
export class BlogsComponent implements OnInit, AfterViewInit {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly blogService = inject(BlogService);
  private readonly authService = inject(AuthService);

  // Left panel
  listFilter: 'ALL' | 'PUBLISHED' | 'DRAFTS' | 'SCHEDULED' = 'ALL';
  listSearch = '';

  isMobile = window.innerWidth < 768;
  isContentExpanded = false;

  // Data
  posts: BlogPost[] = [];

  selectedPostId: string | null = null;
  tagInput = '';

  categories = [...BLOG_CATEGORIES];
  // Used by the template to disable Save during requests
  isCreating = false;

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    const openId = qp.get('id');
    const createNew = qp.get('new') === '1' || qp.get('new') === 'true';

    if (createNew) {
      this.createNewPost();
      void this.router.navigate([], { queryParams: { new: null, id: null }, queryParamsHandling: 'merge' });
      return;
    }

    this.loadPosts(openId);
    if (openId) {
      void this.router.navigate([], { queryParams: { id: null }, queryParamsHandling: 'merge' });
    }
  }

  get selectedPost(): BlogPost | null {
    return this.posts.find(p => p.id === this.selectedPostId) ?? null;
  }

  /** True when the current post is a new (unsaved) one – show Cancel only then */
  get isNewPost(): boolean {
    const p = this.selectedPost;
    return !!p?.id?.startsWith('tmp_');
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

  private loadPosts(preferredId?: string | null): void {
    const reg = this.authService.getDoctorRegistrationNumber() ?? 'me';

    this.blogService.listBlogs(reg).subscribe({
      next: (rows) => {
        this.posts = rows ?? [];
        const preferred = preferredId && this.posts.some(p => p.id === preferredId) ? preferredId : null;
        const keepExisting = this.selectedPostId && this.posts.some(p => p.id === this.selectedPostId) ? this.selectedPostId : null;
        this.selectedPostId = preferred || keepExisting || this.posts[0]?.id || null;
        setTimeout(() => this.loadContentIntoEditor(), 0);
      },
      error: () => {
        this.posts = [];
        this.selectedPostId = null;
      }
    });
  }

  /** New post = local draft only. Nothing is saved until the user clicks Save. */
  createNewPost(): void {
    const tmpId = `tmp_${Date.now()}`;
    const now = new Date();
    const localDraft: BlogPost = {
      id: tmpId,
      title: 'Untitled Article',
      content: '',
      category: 'Health & Wellness',
      tags: [],
      status: 'DRAFT',
      visibility: 'PRIVATE',
      scheduledFor: undefined,
      coverImageUrl: '',
      documents: [],
      views: 0,
      likes: 0,
      updatedAt: now,
      authorName: '',
      readTimeMin: 1
    };
    this.posts = [localDraft, ...this.posts];
    this.selectedPostId = tmpId;
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
    this.syncContentToPost();
  }

  private syncContentToPost(): void {
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
    document.execCommand(command, false); // NOSONAR - legacy API used for lightweight rich-text formatting
    p.content = el.innerHTML;
  }

  /** For preview: render stored HTML safely */
  getSafeContent(): SafeHtml {
    const p = this.selectedPost;
    const html = p?.content ?? '';
    return html ? this.sanitizer.bypassSecurityTrustHtml(html) : this.sanitizer.bypassSecurityTrustHtml('');
  }

  /** Save: for new (tmp_) posts creates on server; for existing posts updates. Uses current Status selection. */
  save(): void {
    const p = this.selectedPost;
    if (!p) return;
    this.syncContentToPost();
    const reg = this.authService.getDoctorRegistrationNumber() ?? 'me';

    if (p.id.startsWith('tmp_')) {
      this.isCreating = true;
      this.blogService.createBlog(reg, {
        title: p.title,
        content: p.content,
        category: p.category,
        tags: p.tags,
        status: p.status,
        visibility: p.visibility,
        scheduledFor: p.scheduledFor,
        coverImageUrl: p.coverImageUrl,
        documents: p.documents
      }).pipe(
        finalize(() => { this.isCreating = false; })
      ).subscribe({
        next: (created) => {
          this.posts = this.posts.map(x => (x.id === p.id ? created : x));
          this.selectedPostId = created.id;
          setTimeout(() => this.loadContentIntoEditor(), 0);
        }
      });
      return;
    }

    this.blogService.updateBlog(reg, p.id, {
      title: p.title,
      content: p.content,
      category: p.category,
      tags: p.tags,
      status: p.status,
      visibility: p.visibility,
      scheduledFor: p.scheduledFor,
      coverImageUrl: p.coverImageUrl,
      documents: p.documents
    }).subscribe({
      next: (saved) => this.replacePost(saved)
    });
  }

  /** Cancel only for new blogs: discard the new post and go back to listing page. */
  cancelNewPost(): void {
    const p = this.selectedPost;
    if (!p?.id.startsWith('tmp_')) return;
    this.posts = this.posts.filter(x => x.id !== p.id);
    this.selectedPostId = null;
    // Use window.location so we reliably leave /blogs/manage and show the listing
    window.location.href = '/blogs';
  }

  duplicateSelectedPost(): void {
    const p = this.selectedPost;
    if (!p) return;
    const reg = this.authService.getDoctorRegistrationNumber() ?? 'me';
    this.blogService.duplicateBlog(reg, p.id).subscribe({
      next: (copy) => {
        this.posts = [copy, ...this.posts];
        this.selectedPostId = copy.id;
        setTimeout(() => this.loadContentIntoEditor(), 0);
      }
    });
  }

  deleteSelectedPost(): void {
    const p = this.selectedPost;
    if (!p) return;
    const reg = this.authService.getDoctorRegistrationNumber() ?? 'me';
    this.blogService.deleteBlog(reg, p.id).subscribe({
      next: () => {
        this.posts = this.posts.filter(x => x.id !== p.id);
        this.selectedPostId = this.posts[0]?.id ?? null;
        setTimeout(() => this.loadContentIntoEditor(), 0);
      }
    });
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
    const reg = this.authService.getDoctorRegistrationNumber() ?? 'me';

    // Upload each file; fallback to local blob URL if upload isn't available.
    for (const f of files) {
      this.blogService.uploadDocument(reg, p.id, f).subscribe({
        next: (doc) => {
          p.documents = [...p.documents, doc];
          p.updatedAt = new Date();
        },
        error: () => {
          const fallback: BlogDocument = {
            id: `doc_${Date.now()}_${f.name}`,
            title: f.name,
            type: this.getDocTypeFromName(f.name),
            url: URL.createObjectURL(f)
          };
          p.documents = [...p.documents, fallback];
          p.updatedAt = new Date();
        }
      });
    }

    input.value = '';
  }

  removeDoc(docId: string): void {
    const p = this.selectedPost;
    if (!p) return;
    const reg = this.authService.getDoctorRegistrationNumber() ?? 'me';
    this.blogService.deleteDocument(reg, p.id, docId).subscribe({
      next: () => {
        p.documents = p.documents.filter(d => d.id !== docId);
        p.updatedAt = new Date();
      },
      error: () => {
        // allow UI removal even if server delete fails
        p.documents = p.documents.filter(d => d.id !== docId);
        p.updatedAt = new Date();
      }
    });
  }

  private getDocTypeFromName(name: string): BlogDocType {
    const n = (name || '').toLowerCase();
    if (n.endsWith('.pdf')) return 'PDF';
    if (n.endsWith('.docx')) return 'DOCX';
    if (n.endsWith('.doc')) return 'DOC';
    if (n.endsWith('.png') || n.endsWith('.jpg') || n.endsWith('.jpeg') || n.endsWith('.gif') || n.endsWith('.webp')) {
      return 'IMAGE';
    }
    return 'FILE';
  }

  getDocIcon(type: BlogDocType): string {
    switch (type) {
      case 'PDF': return 'picture_as_pdf';
      case 'DOC':
      case 'DOCX': return 'description';
      case 'IMAGE': return 'image';
      default: return 'attach_file';
    }
  }

  private isImageDoc(d: BlogDocument): boolean {
    if (d.type === 'IMAGE') return true;
    const n = (d.title || d.url || '').toLowerCase();
    return n.endsWith('.png') || n.endsWith('.jpg') || n.endsWith('.jpeg') || n.endsWith('.gif') || n.endsWith('.webp');
  }

  get imageAttachmentCount(): number {
    const p = this.selectedPost;
    if (!p) return 0;
    return p.documents.filter(d => this.isImageDoc(d)).length;
  }

  get fileAttachmentCount(): number {
    const p = this.selectedPost;
    if (!p) return 0;
    return p.documents.length - this.imageAttachmentCount;
  }

  onCoverSelected(ev: Event): void {
    const p = this.selectedPost;
    if (!p) return;
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reg = this.authService.getDoctorRegistrationNumber() ?? 'me';

    this.blogService.uploadCover(reg, p.id, file).subscribe({
      next: (resp) => {
        p.coverImageUrl = resp?.url || '';
        p.updatedAt = new Date();
      },
      error: () => {
        // fallback to local blob URL
        p.coverImageUrl = URL.createObjectURL(file);
        p.updatedAt = new Date();
      }
    });
    input.value = '';
  }

  private replacePost(saved: BlogPost): void {
    this.posts = this.posts.map(p => (p.id === saved.id ? saved : p));
    this.selectedPostId = saved.id;
    setTimeout(() => this.loadContentIntoEditor(), 0);
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

