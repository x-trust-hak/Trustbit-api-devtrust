import { Router, type IRouter } from "express";
import { ListEndpointsResponse, ListCategoriesResponse, GetApiStatusResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const UPSTREAM = "https://prexzyapis.com";
const EXCLUDED_CATEGORIES = ["NSFW Content"];

const CATEGORY_NAME_MAP: Record<string, string> = {
  "Artificial Intelligence": "AI Suite",
  "Image Generation": "AI Imaging",
  "Anime": "Anime Hub",
  "Downloader": "Media Fetch",
  "Games": "GameZone",
  "Image Creator": "Image Studio",
  "Movies": "CinemaDB",
  "Search": "Search Engine",
  "Random": "Discovery",
  "Audio": "Audio Vault",
  "Sports": "Live Sports",
  "Screenshot Website": "Web Capture",
  "Stalk": "Profile Lookup",
  "Text Maker": "Text FX",
  "Tools": "Dev Tools",
  "Url Shortner": "Link Shrink",
  "StyleText": "Font Forge",
  "Text To Speech": "Voice Synth",
  "Virtual Number": "SMS Inbox",
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "AI Suite": "Conversational AI, reasoning, code generation, and music intelligence",
  "AI Imaging": "Generate stunning images in any artistic style powered by AI models",
  "Anime Hub": "Anime search, episode streaming, character reactions and rich metadata",
  "Media Fetch": "Instantly download media from TikTok, YouTube, Instagram and more",
  "GameZone": "Game stats, leaderboards, trivia and live gaming data endpoints",
  "Image Studio": "Create and manipulate images with custom text overlays and effects",
  "CinemaDB": "Movie and TV show search, cast details and smart recommendations",
  "Search Engine": "Search across the web, YouTube, GitHub, lyrics and beyond",
  "Discovery": "Random anime art, quotes, characters and fun surprise content",
  "Audio Vault": "Search, stream and download audio from free sound libraries",
  "Live Sports": "Real-time football, basketball and multi-sport live scores",
  "Web Capture": "Capture instant full-page screenshots of any URL on demand",
  "Profile Lookup": "Look up public profiles across TikTok, Instagram, Twitter and YouTube",
  "Text FX": "Generate styled text images — glitch, neon, galaxy, fire and more",
  "Dev Tools": "GeoIP lookup, code compiler, translator, HTML tools and utilities",
  "Link Shrink": "Shorten any URL using da.gd, v.gd, spoo.me and other providers",
  "Font Forge": "Transform plain text into stylized Unicode fonts in seconds",
  "Voice Synth": "Convert text to lifelike speech using 100+ voice styles and languages",
  "SMS Inbox": "Access virtual phone numbers worldwide to receive SMS messages",
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
    const displayName = CATEGORY_NAME_MAP[cat.name] ?? cat.name;
    const items = cat.items.map((item) => {
      const [name, info] = Object.entries(item)[0];
      return { name, desc: info.desc, path: info.path };
    });
    if (map.has(displayName)) {
      const ex = map.get(displayName)!;
      ex.items.push(...items);
      ex.count = ex.items.length;
    } else {
      map.set(displayName, { name: displayName, count: items.length, items });
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
