import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppButtonComponent, DividerComponent, IconComponent, PageBodyDirective, PageComponent } from '@lk/core';
import { EntityToolbarComponent } from '../../components/entity-toolbar/entity-toolbar.component';

import { BLOGS_MOCK_POSTS, BlogPost, BlogStatus } from '../blogs/blogs.data';

type StatusFilter = 'ALL' | BlogStatus;
type SortBy = 'UPDATED' | 'VIEWS' | 'LIKES' | 'TITLE';

@Component({
  selector: 'app-blogs-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, PageComponent, PageBodyDirective, IconComponent, DividerComponent, AppButtonComponent, EntityToolbarComponent],
  templateUrl: './blogs-dashboard.component.html',
  styleUrl: './blogs-dashboard.component.scss'
})
export class BlogsDashboardComponent {
  private readonly router = inject(Router);

  // TEMP: mock data until wired to API
  readonly posts = signal<BlogPost[]>([...BLOGS_MOCK_POSTS]);

  readonly search = signal('');
  readonly statusFilter = signal<StatusFilter>('ALL');
  readonly sortBy = signal<SortBy>('UPDATED');
  readonly showFilterPanel = signal(false);

  readonly stats = computed(() => {
    const posts = this.posts();
    const total = posts.length;
    const published = posts.filter(p => p.status === 'PUBLISHED').length;
    const drafts = posts.filter(p => p.status === 'DRAFT').length;
    const scheduled = posts.filter(p => p.status === 'SCHEDULED').length;
    const views = posts.reduce((sum, p) => sum + (p.views || 0), 0);
    const likes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
    return { total, published, drafts, scheduled, views, likes };
  });

  readonly filteredPosts = computed(() => {
    const q = this.search().trim().toLowerCase();
    const filter = this.statusFilter();
    const sort = this.sortBy();

    const filtered = this.posts()
      .filter((p) => {
        if (filter !== 'ALL' && p.status !== filter) return false;
        if (!q) return true;
        return (
          p.title.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.tags.some(t => t.toLowerCase().includes(q))
        );
      });

    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case 'VIEWS':
          return (b.views || 0) - (a.views || 0);
        case 'LIKES':
          return (b.likes || 0) - (a.likes || 0);
        case 'TITLE':
          return a.title.localeCompare(b.title);
        case 'UPDATED':
        default:
          return b.updatedAt.getTime() - a.updatedAt.getTime();
      }
    });

    return sorted;
  });

  setStatusFilter(v: StatusFilter): void {
    this.statusFilter.set(v);
  }

  onSearch(term: string): void {
    this.search.set(term ?? '');
  }

  toggleFilterPanel(): void {
    this.showFilterPanel.update(v => !v);
  }

  onRefresh(): void {
    this.search.set('');
    this.statusFilter.set('ALL');
    this.sortBy.set('UPDATED');
    this.showFilterPanel.set(false);
    // TODO: reload posts when API is wired
  }

  createPost(): void {
    void this.router.navigate(['/blogs/manage'], { queryParams: { new: 1 } });
  }

  managePosts(): void {
    void this.router.navigate(['/blogs/manage']);
  }

  editPost(p: BlogPost): void {
    void this.router.navigate(['/blogs/manage'], { queryParams: { id: p.id } });
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

  excerpt(content: string): string {
    const text = (content || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) return 'No content yet. Open the editor to start writing.';
    return text.length > 140 ? `${text.slice(0, 140)}…` : text;
  }
}

