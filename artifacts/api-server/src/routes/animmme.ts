import { Router, type IRouter, type Request, type Response } from "express";
import { searchAnime, getSeasons, getEpisodes, getDownloadLinks } from "../lib/animeScraper";

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
