import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { HttpService } from '@lk/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { BlogDocument, BlogPost } from '../pages/blogs/blogs.data';

type ApiBlogDocument = BlogDocument;

type ApiBlogResponse = {
  id: string;
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
  status?: BlogPost['status'];
  visibility?: BlogPost['visibility'];
  scheduledFor?: string | null;
  coverImageUrl?: string | null;
  documents?: ApiBlogDocument[] | null;
  views?: number;
  likes?: number;
  updatedAt?: string | null;
  authorName?: string | null;
  readTimeMin?: number;
};

type ApiBlogRequest = {
  id?: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  status: BlogPost['status'];
  visibility: BlogPost['visibility'];
  scheduledFor?: string | null;
  coverImageUrl?: string | null;
  documents: ApiBlogDocument[];
};

@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly baseUrl = `${environment.apiUrl}/api/doctors`;

  constructor(private readonly httpService: HttpService) {}

  listBlogs(registrationNumber: string, params?: { status?: string; search?: string }): Observable<BlogPost[]> {
    const safeDoctor = encodeURIComponent((registrationNumber || '').trim());
    const qs = this.toQueryString(params);
    return this.httpService
      .sendGETRequest(`${this.baseUrl}/${safeDoctor}/blogs${qs}`)
      .pipe(map((rows: ApiBlogResponse[]) => (rows ?? []).map((r) => this.toBlogPost(r))));
  }

  getBlog(registrationNumber: string, blogId: string): Observable<BlogPost> {
    const safeDoctor = encodeURIComponent((registrationNumber || '').trim());
    const safeId = encodeURIComponent((blogId || '').trim());
    return this.httpService
      .sendGETRequest(`${this.baseUrl}/${safeDoctor}/blogs/${safeId}`)
      .pipe(map((r: ApiBlogResponse) => this.toBlogPost(r)));
  }

  createBlog(registrationNumber: string, post: Pick<BlogPost, 'title' | 'content' | 'category' | 'tags' | 'status' | 'visibility' | 'scheduledFor' | 'coverImageUrl' | 'documents'>): Observable<BlogPost> {
    const safeDoctor = encodeURIComponent((registrationNumber || '').trim());
    const payload: any = this.toApiRequest(post);
    return this.httpService
      .sendPOSTRequest(`${this.baseUrl}/${safeDoctor}/blogs/create`, payload)
      .pipe(map((r: ApiBlogResponse) => this.toBlogPost(r)));
  }

  updateBlog(registrationNumber: string, blogId: string, post: Partial<BlogPost>): Observable<BlogPost> {
    const safeDoctor = encodeURIComponent((registrationNumber || '').trim());
    const safeId = encodeURIComponent((blogId || '').trim());
    // Only send fields the backend understands
    const payload: Partial<ApiBlogRequest> = {};
    if (post.title !== undefined) payload.title = post.title;
    if (post.content !== undefined) payload.content = post.content;
    if (post.category !== undefined) payload.category = post.category;
    if (post.tags !== undefined) payload.tags = post.tags;
    if (post.status !== undefined) payload.status = post.status;
    if (post.visibility !== undefined) payload.visibility = post.visibility;
    if (post.scheduledFor !== undefined) payload.scheduledFor = post.scheduledFor ?? null;
    if (post.coverImageUrl !== undefined) payload.coverImageUrl = this.normalizeRemoteUrlOrNull(post.coverImageUrl);
    if (post.documents !== undefined) payload.documents = (post.documents ?? []).filter((d) => !this.isLocalBlobUrl(d?.url));

    return this.httpService
      .sendPUTRequest(`${this.baseUrl}/${safeDoctor}/blogs/${safeId}`, payload as any)
      .pipe(map((r: ApiBlogResponse) => this.toBlogPost(r)));
  }

  deleteBlog(registrationNumber: string, blogId: string): Observable<void> {
    const safeDoctor = encodeURIComponent((registrationNumber || '').trim());
    const safeId = encodeURIComponent((blogId || '').trim());
    return this.httpService.sendDELETERequest(`${this.baseUrl}/${safeDoctor}/blogs/${safeId}`);
  }

  duplicateBlog(registrationNumber: string, blogId: string): Observable<BlogPost> {
    const safeDoctor = encodeURIComponent((registrationNumber || '').trim());
    const safeId = encodeURIComponent((blogId || '').trim());
    return this.httpService
      .sendPOSTRequest(`${this.baseUrl}/${safeDoctor}/blogs/${safeId}/duplicate`, ({ sourceId: blogId } as any))
      .pipe(map((r: ApiBlogResponse) => this.toBlogPost(r)));
  }

  uploadCover(registrationNumber: string, blogId: string, file: File): Observable<{ url: string }> {
    const safeDoctor = encodeURIComponent((registrationNumber || '').trim());
    const safeId = encodeURIComponent((blogId || '').trim());
    const fd = new FormData();
    fd.append('file', file);
    // Pass empty HttpHeaders so the library doesn't force Content-Type: application/json.
    // The browser will auto-set Content-Type: multipart/form-data with the correct boundary.
    return this.httpService
      .sendPOSTRequest(`${this.baseUrl}/${safeDoctor}/blogs/${safeId}/upload/cover`, fd, { headers: new HttpHeaders() } as any)
      .pipe(
        map((resp: any) => ({
          ...(resp && typeof resp === 'object' ? resp : undefined),
          url: this.normalizePublicAssetUrl(resp?.url)
        }))
      );
  }

  uploadDocument(registrationNumber: string, blogId: string, file: File): Observable<BlogDocument> {
    const safeDoctor = encodeURIComponent((registrationNumber || '').trim());
    const safeId = encodeURIComponent((blogId || '').trim());
    const fd = new FormData();
    fd.append('file', file);
    // Pass empty HttpHeaders so the library doesn't force Content-Type: application/json.
    // The browser will auto-set Content-Type: multipart/form-data with the correct boundary.
    return this.httpService
      .sendPOSTRequest(`${this.baseUrl}/${safeDoctor}/blogs/${safeId}/upload/document`, fd, { headers: new HttpHeaders() } as any)
      .pipe(
        map((doc: any) => ({
          ...(doc && typeof doc === 'object' ? doc : undefined),
          url: this.normalizePublicAssetUrl(doc?.url)
        }))
      );
  }

  deleteDocument(registrationNumber: string, blogId: string, docId: string): Observable<void> {
    const safeDoctor = encodeURIComponent((registrationNumber || '').trim());
    const safeId = encodeURIComponent((blogId || '').trim());
    const safeDoc = encodeURIComponent((docId || '').trim());
    return this.httpService.sendDELETERequest(`${this.baseUrl}/${safeDoctor}/blogs/${safeId}/documents/${safeDoc}`);
  }

  private toBlogPost(api: ApiBlogResponse): BlogPost {
    const updatedAt = api?.updatedAt ? new Date(api.updatedAt) : new Date();
    const scheduledFor = this.toDateTimeLocal(api?.scheduledFor ?? null);
    return {
      id: String(api?.id ?? ''),
      title: String(api?.title ?? 'Untitled Article'),
      content: String(api?.content ?? ''),
      category: String(api?.category ?? ''),
      tags: Array.isArray(api?.tags) ? api.tags.filter((t): t is string => Boolean(t)) : [],
      status: (api?.status as BlogPost['status']) ?? 'DRAFT',
      visibility: (api?.visibility as BlogPost['visibility']) ?? 'PRIVATE',
      scheduledFor: scheduledFor ?? undefined,
      coverImageUrl: this.normalizePublicAssetUrl(api?.coverImageUrl ?? ''),
      documents: Array.isArray(api?.documents)
        ? api.documents.map((d) => ({
            ...(d as any),
            url: this.normalizePublicAssetUrl((d as any)?.url)
          }))
        : [],
      views: Number(api?.views ?? 0),
      likes: Number(api?.likes ?? 0),
      updatedAt,
      authorName: String(api?.authorName ?? ''),
      readTimeMin: Number(api?.readTimeMin ?? 1),
    };
  }

  private toApiRequest(post: Pick<BlogPost, 'title' | 'content' | 'category' | 'tags' | 'status' | 'visibility' | 'scheduledFor' | 'coverImageUrl' | 'documents'>): ApiBlogRequest {
    return {
      title: post.title ?? 'Untitled Article',
      content: post.content ?? '',
      category: post.category ?? '',
      tags: post.tags ?? [],
      status: post.status ?? 'DRAFT',
      visibility: post.visibility ?? 'PRIVATE',
      scheduledFor: post.scheduledFor ?? null,
      coverImageUrl: this.normalizeRemoteUrlOrNull(post.coverImageUrl),
      documents: (post.documents ?? []).filter((d) => !this.isLocalBlobUrl(d?.url)),
    };
  }

  private toDateTimeLocal(value: string | null): string | null {
    if (!value) return null;
    const v = String(value).trim();
    // Normalize ISO strings to "YYYY-MM-DDTHH:mm" for datetime-local inputs
    if (v.length >= 16) return v.slice(0, 16);
    return v;
  }

  private toQueryString(params?: { status?: string; search?: string }): string {
    if (!params) return '';
    const q: string[] = [];
    if (params.status) q.push(`status=${encodeURIComponent(params.status)}`);
    if (params.search) q.push(`search=${encodeURIComponent(params.search)}`);
    return q.length ? `?${q.join('&')}` : '';
  }

  private isLocalBlobUrl(url: string | null | undefined): boolean {
    const u = String(url ?? '').trim();
    return u.startsWith('blob:');
  }

  /**
   * Backend sometimes returns an R2 S3 endpoint URL like:
   * `https://<bucket>.<accountId>.r2.cloudflarestorage.com/<key>`
   *
   * That endpoint requires signed S3 requests and will 400/403 in browsers.
   * If the bucket has Public Bucket access enabled, the public URL is typically
   * the same host but on `r2.dev`:
   * `https://<bucket>.<accountId>.r2.dev/<key>`
   */
  private normalizePublicAssetUrl(url: string | null | undefined): string {
    const raw = String(url ?? '').trim();
    if (!raw) return '';
    if (this.isLocalBlobUrl(raw)) return raw;
    // Don't rewrite relative URLs (assets/, /path, etc.)
    if (!/^https?:\/\//i.test(raw)) return raw;

    try {
      const u = new URL(raw);
      const suffix = '.r2.cloudflarestorage.com';
      if (u.hostname.endsWith(suffix)) {
        u.hostname = u.hostname.replace(suffix, '.r2.dev');
        return u.toString();
      }
      return raw;
    } catch {
      return raw;
    }
  }

  private normalizeRemoteUrlOrNull(url: string | null | undefined): string | null {
    if (!url) return null;
    const u = String(url).trim();
    if (!u) return null;
    if (this.isLocalBlobUrl(u)) return null;
    return u;
  }
}

