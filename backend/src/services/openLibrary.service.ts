/**
 * Open Library integration (Phase 4: an additional "Recommended Books"
 * resource type alongside the existing curated Video/Playlist/Reading/
 * Practice LearningMaterial rows - see books.controller.ts for why this is
 * NOT stored as a LearningMaterial).
 *
 * Open Library's search API (https://openlibrary.org/dev/docs/api/search)
 * is public and keyless - there is no secret to protect here, unlike the
 * Groq/LLM integration. A simple in-process TTL cache (course+topic ->
 * normalized results) avoids hitting it on every page render; this project
 * has no existing cache layer, so a Map is the simplest adequate solution -
 * no new dependency, no new infrastructure, easy to delete later if a real
 * cache is ever introduced.
 */

const OPEN_LIBRARY_SEARCH_URL = 'https://openlibrary.org/search.json';
const REQUEST_TIMEOUT_MS = 5000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h - book metadata rarely changes
const MAX_RESULTS = 5;

export interface NormalizedBook {
  title: string;
  authors: string[];
  cover: string | null;
  firstPublishYear: number | null;
  url: string;
  source: 'open_library';
}

export interface BookSearchResult {
  books: NormalizedBook[];
  /** true only on a real failure (timeout/network/non-200) - a genuinely
   * empty result set from a successful search is `books: [], unavailable: false`. */
  unavailable: boolean;
}

interface CacheEntry {
  result: BookSearchResult;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(courseName: string, topicName: string): string {
  return `${courseName.toLowerCase()}::${topicName.toLowerCase()}`;
}

interface OpenLibraryDoc {
  title?: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  key?: string;
}

interface OpenLibrarySearchResponse {
  docs?: OpenLibraryDoc[];
}

function normalize(doc: OpenLibraryDoc): NormalizedBook | null {
  if (!doc.title || !doc.key) return null; // no identifiable title/page isn't useful to a student
  return {
    title: doc.title,
    authors: doc.author_name && doc.author_name.length > 0 ? doc.author_name : ['Unknown author'],
    cover: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
    firstPublishYear: doc.first_publish_year ?? null,
    url: `https://openlibrary.org${doc.key}`,
    source: 'open_library',
  };
}

/**
 * Topic-focused query from real course/topic names only - no
 * course-specific or topic-specific branching, so this works for any
 * course (including ones added after this file was written) without
 * touching this file again.
 */
function buildQuery(courseName: string, topicName: string): string {
  return `${topicName} ${courseName}`;
}

export async function searchBooksForTopic(courseName: string, topicName: string): Promise<BookSearchResult> {
  const key = cacheKey(courseName, topicName);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.result;

  const result = await fetchFromOpenLibrary(courseName, topicName);
  // Cache a successful call (including a legitimate "no results") for the
  // full TTL; never cache a failure, so the next request gets a fresh try.
  if (!result.unavailable) {
    cache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
  }
  return result;
}

async function fetchFromOpenLibrary(courseName: string, topicName: string): Promise<BookSearchResult> {
  const query = buildQuery(courseName, topicName);
  const url = `${OPEN_LIBRARY_SEARCH_URL}?q=${encodeURIComponent(query)}&limit=${MAX_RESULTS}&fields=title,author_name,cover_i,first_publish_year,key`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return { books: [], unavailable: true };

    const data = (await res.json()) as OpenLibrarySearchResponse;
    const docs = Array.isArray(data.docs) ? data.docs : [];
    const books = docs.map(normalize).filter((b): b is NormalizedBook => b !== null).slice(0, MAX_RESULTS);
    return { books, unavailable: false };
  } catch (_err) {
    // Network error, timeout (AbortError), or malformed JSON - the caller
    // (books.controller.ts) must keep the Learning Materials page working
    // regardless, so this never throws.
    return { books: [], unavailable: true };
  } finally {
    clearTimeout(timeout);
  }
}
