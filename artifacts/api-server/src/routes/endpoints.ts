import { Router, type IRouter } from "express";
import { ListEndpointsResponse, ListCategoriesResponse, GetApiStatusResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const UPSTREAM = "https://prexzyapis.com";
const ZSTLAB_UPSTREAM = "https://zstlab.cyou";
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
  "Quotes Vault": "Curated quotes filterable by author or tag",
  "Joke Machine": "General and programming jokes on demand",
  "Fact Finder": "Random and curated facts across topics",
  "Trivia Zone": "Trivia questions across countless categories",
  "World Data": "Country facts, flags, currencies and demographics",
  "News Feed": "Latest headlines and news summaries",
  "Weather": "Live weather conditions and forecasts by location",
  "Crypto Prices": "Live cryptocurrency prices and market data",
  "Math Tools": "Calculations, conversions and math utilities",
  "Color Tools": "Color palettes, conversions and generation",
  "Text Utils": "Text analysis, transformation and formatting utilities",
  "IP Lookup": "IP geolocation and network information",
  "Holidays": "Public holidays by country and date",
  "Encode/Decode": "Base64, URL, hashing and encoding utilities",
  "LongCat AI": "LongCat conversational AI model access",
  "Recipes": "Recipe search and cooking data",
  "Dictionary": "Word definitions, synonyms and language lookup",
  "Animal Facts": "Random facts and images about animals",
  "Space Data": "Astronomy, space and NASA data",
  "Affirmations": "Daily positive affirmations",
  "Number Facts": "Fun and trivia facts about numbers",
  "Currency Exchange": "Live currency conversion rates",
  "Bible Verses": "Bible verse lookup and search",
  "Quran Verses": "Quran verse lookup and search",
  "Hymns": "Hymn lyrics and lookup",
  "Canvas Art": "Generated canvas graphics and art cards",
  "Wallpapers": "High-quality wallpaper images by category",
  "Fun Zone": "Miscellaneous fun and entertainment endpoints",
  "Temp Generator": "Temporary email and disposable data generation",
  "E-Photos": "Photo effects and editing endpoints",
  "PhotoFunia": "Fun photo frame and effect generation",
  "Animation Studio": "Animated image and sticker generation",
  "FZ Series": "FZ series data endpoints",
};

const ZSTLAB_CATEGORY_MAP: Record<string, string> = {
  quotes: "Quotes Vault",
  jokes: "Joke Machine",
  facts: "Fact Finder",
  trivia: "Trivia Zone",
  countries: "World Data",
  news: "News Feed",
  weather: "Weather",
  crypto: "Crypto Prices",
  math: "Math Tools",
  colors: "Color Tools",
  text: "Text Utils",
  ip: "IP Lookup",
  holidays: "Holidays",
  ai: "AI Suite",
  download: "Media Fetch",
  encode: "Encode/Decode",
  utility: "Dev Tools",
  search: "Search Engine",
  media: "Audio Vault",
  longcat: "LongCat AI",
  movies: "CinemaDB",
  waifu: "Anime Hub",
  anime: "Anime Hub",
  stalker: "Profile Lookup",
  recipes: "Recipes",
  dictionary: "Dictionary",
  animals: "Animal Facts",
  space: "Space Data",
  affirmations: "Affirmations",
  numbers: "Number Facts",
  currency: "Currency Exchange",
  bible: "Bible Verses",
  quran: "Quran Verses",
  hymns: "Hymns",
  canvas: "Canvas Art",
  wallpaper: "Wallpapers",
  fun: "Fun Zone",
  sports: "Live Sports",
  tempgen: "Temp Generator",
  shortner: "Link Shrink",
  ephotos: "E-Photos",
  textpro: "Text FX",
  photofunia: "PhotoFunia",
  tools: "Dev Tools",
  football: "Live Sports",
  animation: "Animation Studio",
  fzseries: "FZ Series",
};

type RawCategory = { name: string; items: Array<Record<string, { desc: string; path: string }>> };
type MergedCategory = { name: string; count: number; items: { name: string; desc: string; path: string }[] };
type ZstlabEndpoint = {
  id: string;
  category: string;
  method: string;
  path: string;
  summary: string;
  description: string;
  requiresApiKey?: boolean;
};

let cachedEndpoints: { endpoints?: RawCategory[] } | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

let cachedZstlab: ZstlabEndpoint[] | null = null;
let zstlabCacheTime = 0;

async function fetchUpstream(): Promise<{ endpoints?: RawCategory[] }> {
  const now = Date.now();
  if (cachedEndpoints && now - cacheTime < CACHE_TTL) return cachedEndpoints;
  const res = await fetch(`${UPSTREAM}/endpoints`, {
    headers: { "User-Agent": "TrustbitAPI/1.0" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Upstream returned ${res.status}`);
  const data = await res.json() as { endpoints?: RawCategory[] };
  cachedEndpoints = data;
  cacheTime = now;
  return data;
}

async function fetchZstlabUpstream(): Promise<ZstlabEndpoint[]> {
  const now = Date.now();
  if (cachedZstlab && now - zstlabCacheTime < CACHE_TTL) return cachedZstlab;
  const res = await fetch(`${ZSTLAB_UPSTREAM}/api/endpoints`, {
    headers: { "User-Agent": "TrustbitAPI/1.0" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Zstlab upstream returned ${res.status}`);
  const data = await res.json() as ZstlabEndpoint[];
  cachedZstlab = data;
  zstlabCacheTime = now;
  return data;
}

function mergePrexzyIntoMap(map: Map<string, MergedCategory>, raw: RawCategory[]): void {
  for (const cat of raw) {
    const mappedName = CATEGORY_NAME_MAP[cat.name] ?? cat.name;
    if (EXCLUDED_CATEGORIES.includes(cat.name) || EXCLUDED_CATEGORIES.includes(mappedName)) continue;

    if (!map.has(mappedName)) {
      map.set(mappedName, { name: mappedName, count: 0, items: [] });
    }
    const entry = map.get(mappedName)!;

    for (const itemObj of cat.items) {
      for (const [name, meta] of Object.entries(itemObj)) {
        const path = meta.path.startsWith("/") ? meta.path : "/" + meta.path;
        const exists = entry.items.some((i) => i.path === path);
        if (!exists) {
          entry.items.push({ name, desc: meta.desc, path });
          entry.count++;
        }
      }
    }
  }
}

function mergeZstlabIntoMap(map: Map<string, MergedCategory>, raw: ZstlabEndpoint[]): void {
  for (const ep of raw) {
    const mappedName = ZSTLAB_CATEGORY_MAP[ep.category] ?? ep.category;
    if (EXCLUDED_CATEGORIES.includes(mappedName)) continue;

    if (!map.has(mappedName)) {
      map.set(mappedName, { name: mappedName, count: 0, items: [] });
    }
    const entry = map.get(mappedName)!;

    const path = "/zst" + ep.path.replace(/^\/api/, "");
    const exists = entry.items.some((i) => i.path === path);
    if (!exists) {
      const name = ep.summary || ep.id || path;
      const desc = ep.description || `${ep.method} ${path}`;
      entry.items.push({ name, desc, path });
      entry.count++;
    }
  }
}

async function buildMergedCategories(): Promise<MergedCategory[]> {
  const [prexzyResult, zstlabResult] = await Promise.allSettled([fetchUpstream(), fetchZstlabUpstream()]);

  const map = new Map<string, MergedCategory>();
  if (prexzyResult.status === "fulfilled") {
    mergePrexzyIntoMap(map, prexzyResult.value.endpoints ?? []);
  }
  if (zstlabResult.status === "fulfilled") {
    mergeZstlabIntoMap(map, zstlabResult.value);
  }

  if (prexzyResult.status === "rejected" && zstlabResult.status === "rejected") {
    throw new Error("All upstreams failed");
  }

  return Array.from(map.values()).filter((c) => c.items.length > 0);
}

router.get("/endpoints", async (req, res): Promise<void> => {
  try {
    const categories = await buildMergedCategories();
    const totalEndpoints = categories.reduce((sum, c) => sum + c.count, 0);

    const parsed = ListEndpointsResponse.safeParse({ categories, totalEndpoints });
    if (!parsed.success) {
      res.json({ categories, totalEndpoints });
      return;
    }
    res.json(parsed.data);
  } catch (err) {
    res.status(502).json({ error: "Failed to fetch endpoints from upstream" });
  }
});

router.get("/categories", async (req, res): Promise<void> => {
  try {
    const merged = await buildMergedCategories();

    const categories = merged.map((c) => ({
      name: c.name,
      slug: c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      count: c.count,
      description: CATEGORY_DESCRIPTIONS[c.name] ?? `${c.name} endpoints`,
    }));

    const parsed = ListCategoriesResponse.safeParse({ categories, total: categories.length });
    if (!parsed.success) {
      res.json({ categories, total: categories.length });
      return;
    }
    res.json(parsed.data);
  } catch (err) {
    res.status(502).json({ error: "Failed to fetch categories from upstream" });
  }
});

router.get("/status", async (req, res): Promise<void> => {
  try {
    const categories = await buildMergedCategories();
    const totalEndpoints = categories.reduce((sum, c) => sum + c.count, 0);

    const payload = {
      status: "operational",
      version: "1.0.0",
      uptime: process.uptime(),
      totalEndpoints,
      categories: categories.length,
    };

    const parsed = GetApiStatusResponse.safeParse(payload);
    res.json(parsed.success ? parsed.data : payload);
  } catch (err) {
    res.status(502).json({ error: "Upstream unreachable" });
  }
});

export default router;
