const API_BASE = '/api';

export interface UserInitResponse {
  userId: string;
  variants: Record<string, string>;
  experimentTags: Array<{ expId: string; variant: string; layer: string }>;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  coverUrl: string;
  description: string;
  category: string;
  price: number;
  chapterCount: number;
}

export interface Chapter {
  id: number;
  bookId: number;
  title: string;
  content: string;
  sortOrder: number;
}

export interface EventTag {
  expId: string;
  variant: string;
  layer: string;
}

export async function initUser(userId?: string): Promise<UserInitResponse> {
  const params = userId ? `?userId=${userId}` : '';
  const res = await fetch(`${API_BASE}/user/init${params}`, { method: 'POST' });
  return res.json();
}

export async function listBooks(current = 1, size = 20, category?: string): Promise<{ records: Book[]; total: number }> {
  const params = new URLSearchParams({ current: String(current), size: String(size) });
  if (category) params.set('category', category);
  const res = await fetch(`${API_BASE}/books?${params}`);
  return res.json();
}

export async function getBook(id: number): Promise<Book> {
  const res = await fetch(`${API_BASE}/books/${id}`);
  return res.json();
}

export async function getChapters(bookId: number): Promise<Chapter[]> {
  const res = await fetch(`${API_BASE}/books/${bookId}/chapters`);
  return res.json();
}

export async function getChapter(bookId: number, chapterId: number): Promise<Chapter> {
  const res = await fetch(`${API_BASE}/books/${bookId}/chapters/${chapterId}`);
  return res.json();
}

export async function recordReading(userId: string, bookId: number, chapterId: number, progress: number): Promise<void> {
  await fetch(`${API_BASE}/reading/record`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, bookId, chapterId, readProgress: progress }),
  });
}

export async function subscribe(userId: string, planType: string): Promise<{ success: boolean; subscriptionId: number }> {
  const res = await fetch(`${API_BASE}/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, planType }),
  });
  return res.json();
}

export async function reportEvent(eventType: string, userId: string, experimentTags: EventTag[], properties: Record<string, unknown> = {}) {
  return fetch(`${API_BASE}/events/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventType,
      userId,
      timestamp: Date.now(),
      platform: 'readmore-h5',
      experimentTags,
      properties,
    }),
  });
}
