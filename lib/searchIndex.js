// Shared index + cache for Quarto search.json
// Works in Vercel serverless (module-level cache persists per instance)

const MiniSearch = require('minisearch');

const BASE = 'https://bkenkel.com/qps1/';
const INDEX_URL = `${BASE}search.json`;

let cache = {
  etag: null,
  lastModified: null,
  lastFetchAt: 0,
  docs: [],
  mini: null
};

function buildIndex(docs) {
  const mini = new MiniSearch({
    idField: 'href',
    fields: ['title', 'text', 'section'],
    storeFields: ['title', 'text', 'section', 'href'],
    searchOptions: {
      boost: { title: 2, section: 1.5, text: 1 },
      prefix: true,
      fuzzy: 0.2
    }
  });
  mini.addAll(docs);
  return mini;
}

async function ensureIndex(force = false) {
  const now = Date.now();
  const STALE_MS = 6 * 60 * 60 * 1000; // 6h cache window

  if (!force && cache.mini && now - cache.lastFetchAt < STALE_MS) return;

  const headers = {};
  if (cache.etag) headers['If-None-Match'] = cache.etag;
  if (cache.lastModified) headers['If-Modified-Since'] = cache.lastModified;

  const res = await fetch(INDEX_URL, { headers });
  if (res.status === 304) {
    cache.lastFetchAt = now;
    return;
  }
  if (!res.ok) {
    if (!cache.mini) throw new Error(`Failed to fetch ${INDEX_URL}: ${res.status}`);
    // keep old index on transient failure
    return;
  }

  cache.etag = res.headers.get('etag');
  cache.lastModified = res.headers.get('last-modified');
  cache.docs = await res.json();
  cache.mini = buildIndex(cache.docs);
  cache.lastFetchAt = now;
}

function lectureLabelFromHref(href = '') {
  const m = href.toLowerCase().match(/lecture-(\d{2})/);
  return m ? `Lecture ${m[1]}` : null;
}

function decorate(doc, score = 0) {
  const href = doc.href || '';
  const url = href.startsWith('http') ? href : BASE + href.replace(/^\//, '');
  const text = (doc.text || '').replace(/\s+/g, ' ').trim();
  const snippet = text.length > 220 ? text.slice(0, 217) + '…' : text;
  return {
    title: doc.title || doc.section || 'Untitled',
    url,
    lecture_label: lectureLabelFromHref(href),
    section: doc.section || null,
    slide_number: null,
    snippet,
    score,
    updated_at: new Date(cache.lastFetchAt).toISOString()
  };
}

function passesFilters(doc, filters) {
  if (!filters) return true;
  let ok = true;
  if (filters.lecture != null) {
    const want = String(filters.lecture).padStart(2, '0');
    ok = ok && (doc.href || '').toLowerCase().includes(`lecture-${want}`);
  }
  if (filters.section) {
    const sec = (doc.section || doc.title || '').toLowerCase();
    ok = ok && sec.includes(String(filters.section).toLowerCase());
  }
  return ok;
}

async function searchIndex(query, topK = 5, filters = null) {
  await ensureIndex();
  const maxK = Math.max(1, Math.min(20, topK || 5));
  const hits = cache.mini.search(query, {
    prefix: true,
    fuzzy: 0.2,
    filter: (doc) => passesFilters(doc, filters)
  });
  return hits.slice(0, maxK).map(h => decorate(h, h.score || 0));
}

module.exports = { ensureIndex, searchIndex, decorate, BASE };

