import { Router, type IRouter, type Request, type Response } from "express";
import axios from "axios";
import * as cheerio from "cheerio";

const BASE = "https://www.cartoonsarea.cc";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AnimeResult {
  id: number;
  title: string;
  url: string;
  image: string;
}

export interface Season {
  id: number;
  title: string;
  url: string;
}

export interface Episode {
  id: number;
  title: string;
  url: string;
}

export interface DownloadLink {
  quality: string;
  url: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toAbsolute(href: string, pageUrl?: string): string | null {
  if (!href) return null;
  if (href.startsWith("http")) return href;
  if (href.startsWith("//")) return "https:" + href;
  try { return new URL(href, pageUrl ?? BASE).href; } catch { return null; }
}

async function fetchHtml(url: string, referer?: string): Promise<{ html: string; finalUrl: string }> {
  const res = await axios.get<string>(url, {
    headers: { ...HEADERS, ...(referer ? { Referer: referer } : {}) },
    timeout: 20000,
    maxRedirects: 15,
    responseType: "text",
  });
  const finalUrl = (res.request as { res?: { responseUrl?: string } })?.res?.responseUrl ?? url;
  return { html: res.data, finalUrl };
}

async function fetchWithRetry(url: string, referer?: string): Promise<{ html: string; finalUrl: string }> {
  try {
    return await fetchHtml(url, referer);
  } catch {
    await new Promise((r) => setTimeout(r, 1200));
    return await fetchHtml(url, referer);
  }
}

function parseQuality(url: string, linkText: string): string {
  const fromText = linkText.match(/(\d{3,4}p)/i);
  if (fromText) return fromText[1].toLowerCase();
  const fromUrl = url.match(/(\d{3,4}p)/i);
  if (fromUrl) return fromUrl[1].toLowerCase();
  if (/\b(hd|high)\b/i.test(url)) return "HD";
  if (/\b(sd|low)\b/i.test(url)) return "SD";
  return "HD";
}

const QUALITY_ORDER = ["144p", "240p", "360p", "480p", "720p", "1080p", "1440p", "2160p", "hd", "sd"];
function qualitySortKey(q: string): number {
  const idx = QUALITY_ORDER.indexOf(q.toLowerCase());
  return idx === -1 ? 99 : idx;
}

function cleanSeasonTitle(raw: string): string {
  const m = raw.match(/Season\s*(\d+)/i);
  if (m) return `Season ${parseInt(m[1], 10)}`;
  return raw.replace(/[-\s]*(Subbed|Dubbed)[-\s]*Videos?/gi, "").replace(/-/g, " ").trim();
}

function parseEpNumber(href: string, text: string): number {
  const m = href.match(/Episode-0*(\d+)/i) ?? text.match(/Episode\s+0*(\d+)/i);
  if (m) return parseInt(m[1], 10);
  return 9999;
}

function isEpisodeFolder(href: string): boolean {
  if (!/Episode/i.test(href)) return false;
  if (/\.mp4|\.php/i.test(href)) return false;
  return href.endsWith("/") || /Episode-\d+/i.test(href);
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchAnime(query: string): Promise<AnimeResult[]> {
  const clean = query.trim();
  if (!clean) return [];

  const letter = clean[0].toUpperCase();
  const indexUrls = [
    `${BASE}/Japanese-Dubbed-Videos/${letter}-Subbed-Series/`,
    `${BASE}/English-Dubbed-Videos/${letter}-Dubbed-Series/`,
  ];

  const results: AnimeResult[] = [];
  const seenUrls = new Set<string>();

  for (const indexUrl of indexUrls) {
    try {
      const { data } = await axios.get<string>(indexUrl, { headers: HEADERS, timeout: 15000 });
      const $ = cheerio.load(data);

      $("a[href]").each((_, el) => {
        const href = $(el).attr("href") ?? "";
        const title = $(el).text().trim();
        if (!title || !href) return;
        if (!/-Videos\/?$/.test(href)) return;
        if (/Season|Episode|\d+\.mp4/i.test(href)) return;
        if (!title.toLowerCase().includes(clean.toLowerCase())) return;

        const url = toAbsolute(href, BASE);
        if (!url || seenUrls.has(url)) return;
        seenUrls.add(url);

        const img = $(el).find("img").attr("src") ??
          $(el).closest("td, li, div").find("img").attr("src") ?? "";
        const image = img ? toAbsolute(img, BASE) ?? "" : "";

        results.push({ id: results.length + 1, title, url, image });
      });
    } catch { /* silently skip missing index pages */ }
  }

  return results;
}

// ─── Seasons ──────────────────────────────────────────────────────────────────

export async function getSeasons(url: string): Promise<Season[]> {
  const { data } = await axios.get<string>(url, {
    headers: { ...HEADERS, Referer: `${BASE}/` },
    timeout: 15000,
  });

  const $ = cheerio.load(data);
  const seasons: Season[] = [];
  const seenUrls = new Set<string>();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const text = $(el).text().trim();
    if (!href || !text) return;
    if (!/Season/i.test(href) || !/Season/i.test(text)) return;
    if (/Episode|\d+\.mp4/i.test(href)) return;

    const seasonUrl = toAbsolute(href, BASE);
    if (!seasonUrl || seenUrls.has(seasonUrl)) return;
    seenUrls.add(seasonUrl);

    seasons.push({ id: seasons.length + 1, title: cleanSeasonTitle(text), url: seasonUrl });
  });

  return seasons;
}

// ─── Episodes ─────────────────────────────────────────────────────────────────

export async function getEpisodes(url: string): Promise<Episode[]> {
  const { data } = await axios.get<string>(url, {
    headers: { ...HEADERS, Referer: `${BASE}/` },
    timeout: 15000,
  });

  const $ = cheerio.load(data);
  interface RawEp { id: number; title: string; url: string; _epNum: number }
  const episodes: RawEp[] = [];
  const seenUrls = new Set<string>();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const rawText = $(el).text().trim();
    if (!isEpisodeFolder(href)) return;

    const episodeUrl = toAbsolute(href, BASE);
    if (!episodeUrl || seenUrls.has(episodeUrl)) return;
    seenUrls.add(episodeUrl);

    const title = rawText || (() => {
      const m = href.match(/Episode-0*(\d+)/i);
      return m ? `Episode ${parseInt(m[1], 10)}` : "Episode";
    })();

    episodes.push({ id: 0, title, url: episodeUrl, _epNum: parseEpNumber(href, rawText) });
  });

  episodes.sort((a, b) => a._epNum - b._epNum);
  return episodes.map((ep, i) => ({ id: i + 1, title: ep.title, url: ep.url }));
}

// ─── Download Links ───────────────────────────────────────────────────────────

function extractPhpLinks(html: string, pageUrl: string): { phpUrl: string; quality: string }[] {
  const $ = cheerio.load(html);
  const seen = new Set<string>();
  const links: { phpUrl: string; quality: string }[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const label = $(el).text().trim();
    if (/\.mp4\.php/i.test(href)) {
      const abs = toAbsolute(href, pageUrl);
      if (abs && !seen.has(abs)) {
        seen.add(abs);
        links.push({ phpUrl: abs, quality: parseQuality(href, label) });
      }
    }
  });

  // Regex fallback
  if (!links.length) {
    const rx = /href="([^"]+\.mp4\.php)"/gi;
    let m: RegExpExecArray | null;
    while ((m = rx.exec(html)) !== null) {
      const abs = toAbsolute(m[1], pageUrl);
      if (abs && !seen.has(abs)) {
        seen.add(abs);
        links.push({ phpUrl: abs, quality: parseQuality(m[1], "") });
      }
    }
  }

  return links;
}

function extractMp4Link(html: string, pageUrl: string): string | null {
  const $ = cheerio.load(html);

  // Primary: .download-btn with /USER-DATA/ href
  const btn = $("a.download-btn[href], a[download][href]").filter((_, el) => {
    const h = $(el).attr("href") ?? "";
    return /\/USER-DATA\//i.test(h) || /\.mp4/i.test(h);
  }).first();
  if (btn.length) return toAbsolute(btn.attr("href") ?? "", pageUrl);

  // Fallback: any link to /USER-DATA/
  const userDataLink = $("a[href*='/USER-DATA/']").first();
  if (userDataLink.length) return toAbsolute(userDataLink.attr("href") ?? "", pageUrl);

  // Regex fallback
  const rx = /href="([^"]*(?:\/USER-DATA\/|\.mp4)[^"]*)"/i;
  const m = html.match(rx);
  if (m) return toAbsolute(m[1], pageUrl);

  return null;
}

export async function getDownloadLinks(url: string): Promise<DownloadLink[]> {
  const { html: folderHtml, finalUrl: folderFinal } = await fetchWithRetry(url, `${BASE}/`);
  const phpReferer = folderFinal;

  let phpEntries = extractPhpLinks(folderHtml, folderFinal);

  // If none found, try direct .mp4 extraction on the folder page
  if (!phpEntries.length) {
    const mp4Direct = extractMp4Link(folderHtml, folderFinal);
    if (mp4Direct) {
      return [{ quality: parseQuality(mp4Direct, ""), url: mp4Direct }];
    }
    return [];
  }

  const settled = await Promise.allSettled(
    phpEntries.map(async ({ phpUrl, quality }) => {
      const { html: phpHtml, finalUrl: phpFinal } = await fetchWithRetry(phpUrl, phpReferer);
      const mp4Url = extractMp4Link(phpHtml, phpFinal);
      if (!mp4Url) return null;
      const refinedQuality = quality === "HD" ? parseQuality(mp4Url, "") : quality;
      return { quality: refinedQuality, url: mp4Url };
    })
  );

  const links: DownloadLink[] = settled
    .filter((r): r is PromiseFulfilledResult<DownloadLink | null> => r.status === "fulfilled" && r.value !== null)
    .map((r) => r.value as DownloadLink);

  const seen = new Set<string>();
  const unique = links.filter((l) => {
    if (seen.has(l.url)) return false;
    seen.add(l.url);
    return true;
  });

  unique.sort((a, b) => qualitySortKey(a.quality) - qualitySortKey(b.quality));
  return unique;
}

const router: IRouter = Router();

// Simple in-memory cache to avoid hammering cartoonsarea.cc
const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() < hit.expires) return Promise.resolve(hit.data as T);
  return fn().then((data) => {
    cache.set(key, { data, expires: Date.now() + CACHE_TTL });
    return data;
  });
}

/**
 * GET /api/anime/search?q=naruto
 * Search for anime by name.
 */
router.get("/anime/search", async (req: Request, res: Response): Promise<void> => {
  const q = String(req.query["q"] ?? "").trim();
  if (!q) {
    res.status(400).json({ status: false, error: "q parameter is required" });
    return;
  }
  try {
    const results = await cached(`search:${q.toLowerCase()}`, () => searchAnime(q));
    res.json({ status: true, query: q, total: results.length, results });
  } catch (err) {
    req.log.error({ err }, "anime search failed");
    res.status(502).json({ status: false, error: "Failed to fetch search results" });
  }
});

/**
 * GET /api/anime/seasons?url=<anime-page-url>
 * List all seasons for an anime.
 */
router.get("/anime/seasons", async (req: Request, res: Response): Promise<void> => {
  const url = String(req.query["url"] ?? "").trim();
  if (!url || !url.startsWith("http")) {
    res.status(400).json({ status: false, error: "url parameter is required (full anime page URL)" });
    return;
  }
  try {
    const seasons = await cached(`seasons:${url}`, () => getSeasons(url));
    res.json({ status: true, url, total: seasons.length, seasons });
  } catch (err) {
    req.log.error({ err }, "anime seasons failed");
    res.status(502).json({ status: false, error: "Failed to fetch seasons" });
  }
});

/**
 * GET /api/anime/episodes?url=<season-page-url>
 * List all episodes for a season.
 */
router.get("/anime/episodes", async (req: Request, res: Response): Promise<void> => {
  const url = String(req.query["url"] ?? "").trim();
  if (!url || !url.startsWith("http")) {
    res.status(400).json({ status: false, error: "url parameter is required (full season page URL)" });
    return;
  }
  try {
    const episodes = await cached(`episodes:${url}`, () => getEpisodes(url));
    res.json({ status: true, url, total: episodes.length, episodes });
  } catch (err) {
    req.log.error({ err }, "anime episodes failed");
    res.status(502).json({ status: false, error: "Failed to fetch episodes" });
  }
});

/**
 * GET /api/anime/links?url=<episode-page-url>
 * Get all quality download/stream links for an episode.
 */
router.get("/anime/links", async (req: Request, res: Response): Promise<void> => {
  const url = String(req.query["url"] ?? "").trim();
  if (!url || !url.startsWith("http")) {
    res.status(400).json({ status: false, error: "url parameter is required (full episode page URL)" });
    return;
  }
  try {
    const links = await cached(`links:${url}`, () => getDownloadLinks(url));
    res.json({ status: true, url, total: links.length, links });
  } catch (err) {
    req.log.error({ err }, "anime links failed");
    res.status(502).json({ status: false, error: "Failed to fetch download links" });
  }
});

export default router;
