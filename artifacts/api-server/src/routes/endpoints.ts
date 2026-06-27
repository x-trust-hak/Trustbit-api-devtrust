import { Router, type IRouter } from "express";
import { ListEndpointsResponse, ListCategoriesResponse, GetApiStatusResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const UPSTREAM = "https://prexzyapis.com";
const EXCLUDED_CATEGORIES = ["NSFW Content"];

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "Artificial Intelligence": "Chat, reasoning, code generation, image and music AI endpoints",
  "Image Generation": "Generate images in various artistic styles using AI",
  "Anime": "Anime search, streaming, episodes, reactions and metadata",
  "Downloader": "Download media from TikTok, YouTube, Instagram and more",
  "Games": "Game data, stats, quizzes and information endpoints",
  "Image Creator": "Create and manipulate images with custom text overlays",
  "Movies": "Movie and TV show search, details, and recommendations",
  "Search": "Search across web, YouTube, GitHub, lyrics and more",
  "Random": "Random images, anime characters, quotes and fun content",
  "Audio": "FreeSound search, download and audio utilities",
  "Sports": "Live football, basketball, and other sports scores",
  "Screenshot Website": "Capture full-page screenshots of any website URL",
  "Stalk": "Lookup social media profiles: TikTok, Instagram, Twitter, YouTube",
  "Text Maker": "Generate styled text images with glitch, neon, galaxy and more effects",
  "Tools": "GeoIP, code compiler, translators, HTML tools and utilities",
  "Url Shortner": "Shorten URLs with da.gd, v.gd, spoo.me and others",
  "StyleText": "Convert plain text into stylized Unicode fonts instantly",
  "Text To Speech": "Convert text to speech using 100+ voice styles and languages",
  "Virtual Number": "Access virtual phone numbers to receive SMS messages",
};

type RawCategory = { name: string; items: Array<Record<string, { desc: string; path: string }>> };
type MergedCategory = { name: string; count: number; items: { name: string; desc: string; path: string }[] };

let cachedEndpoints: { endpoints?: RawCategory[] } | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function fetchUpstream(): Promise<{ endpoints?: RawCategory[] }> {
  const now = Date.now();
  if (cachedEndpoints && now - cacheTime < CACHE_TTL) return cachedEndpoints;
  const res = await fetch(`${UPSTREAM}/endpoints`, {
    headers: { "User-Agent": "TrustbitAPI/1.0" },
    signal: AbortSignal.timeout(15000),
  });
  const data = (await res.json()) as { endpoints?: RawCategory[] };
  cachedEndpoints = data;
  cacheTime = now;
  return data;
}

function buildCategoryMap(rawCategories: RawCategory[]): Map<string, MergedCategory> {
  const filtered = rawCategories.filter((c) => !EXCLUDED_CATEGORIES.includes(c.name));
  const map = new Map<string, MergedCategory>();
  for (const cat of filtered) {
    const items = cat.items.map((item) => {
      const [name, info] = Object.entries(item)[0];
      return { name, desc: info.desc, path: info.path };
    });
    if (map.has(cat.name)) {
      const ex = map.get(cat.name)!;
      ex.items.push(...items);
      ex.count = ex.items.length;
    } else {
      map.set(cat.name, { name: cat.name, count: items.length, items });
    }
  }
  for (const cat of map.values()) {
    cat.items.sort((a, b) => a.name.localeCompare(b.name));
  }
  return map;
}

router.get("/endpoints", async (req, res): Promise<void> => {
  try {
    const data = await fetchUpstream();
    const map = buildCategoryMap(data.endpoints ?? []);
    const categories = Array.from(map.values());
    const totalEndpoints = categories.reduce((s, c) => s + c.count, 0);
    res.json(ListEndpointsResponse.parse({ status: true, creator: "trustbit", totalEndpoints, categories }));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch endpoints");
    res.status(502).json({ status: false, error: "Failed to retrieve endpoints" });
  }
});

router.get("/categories", async (req, res): Promise<void> => {
  try {
    const data = await fetchUpstream();
    const map = buildCategoryMap(data.endpoints ?? []);
    const categories = Array.from(map.values()).map((cat) => ({
      name: cat.name,
      slug: cat.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      count: cat.count,
      description: CATEGORY_DESCRIPTIONS[cat.name] ?? cat.name + " endpoints",
    }));
    res.json(ListCategoriesResponse.parse({ status: true, categories, total: categories.length }));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch categories");
    res.status(502).json({ status: false, error: "Failed to retrieve categories" });
  }
});

router.get("/status", async (_req, res): Promise<void> => {
  try {
    const data = await fetchUpstream();
    const map = buildCategoryMap(data.endpoints ?? []);
    const total = Array.from(map.values()).reduce((s, c) => s + c.count, 0);
    res.json(GetApiStatusResponse.parse({
      status: "active",
      platform: "Trustbit API",
      totalEndpoints: total,
      uptime: process.uptime(),
      version: "1.0.0",
    }));
  } catch {
    res.json(GetApiStatusResponse.parse({ status: "active", platform: "Trustbit API", totalEndpoints: 545, uptime: process.uptime(), version: "1.0.0" }));
  }
});

export default router;
