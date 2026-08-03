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
  "Anime Stream": "Search anime, browse seasons and episodes, and get direct stream/download links",
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

// ─── Native Anime Stream endpoints (served directly by this server) ────────────
const ANIME_STREAM_CATEGORY: MergedCategory = {
  name: "Anime Stream",
  count: 4,
  items: [
    {
      name: "Search Anime",
      desc: "Search for anime titles by name. Returns a list of matching series with their page URLs.",
      path: "/anime/search?q=naruto",
    },
    {
      name: "Get Seasons",
      desc: "List all seasons for a given anime series. Pass the anime page URL from the search result.",
      path: "/anime/seasons?url=https://www.cartoonsarea.cc/Japanese-Dubbed-Videos/N-Subbed-Series/Naruto-Subbed-Videos/",
    },
    {
      name: "Get Episodes",
      desc: "List all episodes for a season. Pass the season page URL from the seasons result.",
      path: "/anime/episodes?url=https://www.cartoonsarea.cc/Japanese-Dubbed-Videos/N-Subbed-Series/Naruto-Subbed-Videos/Naruto-Season-01-Subbed-Videos/",
    },
    {
      name: "Get Download Links",
      desc: "Get all quality MP4 stream/download links for an episode. Returns URLs sorted from lowest to highest quality.",
      path: "/anime/links?url=https://www.cartoonsarea.cc/Japanese-Dubbed-Videos/N-Subbed-Series/Naruto-Subbed-Videos/Naruto-Season-01-Subbed-Videos/Episode-1/",
    },
  ],
};

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
  if (!res.ok) throw new Error(`Upstream returned ${res.status}`);
  const data = await res.json() as { endpoints?: RawCategory[] };
  cachedEndpoints = data;
  cacheTime = now;
  return data;
}

function buildCategories(raw: RawCategory[]): MergedCategory[] {
  const map = new Map<string, MergedCategory>();
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

  // Inject local cartoonsarea anime endpoints into "Anime Hub"
  const animeHub = map.get("Anime Hub");
  if (animeHub) {
    const localItems = [
      {
        name: "CartoonsArea - Anime Search",
        desc: "Search CartoonsArea alphabetical index for Japanese subbed and English dubbed anime series by title.",
        path: "/anime/search?q="
      },
      {
        name: "CartoonsArea - Anime Seasons",
        desc: "Parse and list all seasons for a chosen anime series using the anime's series page URL.",
        path: "/anime/seasons?url="
      },
      {
        name: "CartoonsArea - Anime Episodes",
        desc: "Parse and list all episodes for a chosen season using the season page URL.",
        path: "/anime/episodes?url="
      },
      {
        name: "CartoonsArea - Download Links",
        desc: "Extract all direct high/medium/low quality MP4 stream and download links for a chosen episode using the episode page URL.",
        path: "/anime/links?url="
      }
    ];

    for (const item of localItems) {
      const exists = animeHub.items.some((i) => i.path === item.path);
      if (!exists) {
        animeHub.items.unshift(item);
        animeHub.count++;
      }
    }
  }

  return Array.from(map.values()).filter((c) => c.items.length > 0);
}

function withAnimeCategory(categories: MergedCategory[]): MergedCategory[] {
  // Prepend Anime Stream so it sits near the top, before other categories
  return [ANIME_STREAM_CATEGORY, ...categories];
}

router.get("/endpoints", async (req, res): Promise<void> => {
  try {
    const data = await fetchUpstream();
    const categories = withAnimeCategory(buildCategories(data.endpoints ?? []));
    const totalEndpoints = categories.reduce((sum, c) => sum + c.count, 0);
    const parsed = ListEndpointsResponse.safeParse({ categories, totalEndpoints });
    res.json(parsed.success ? parsed.data : { categories, totalEndpoints });
  } catch {
    res.status(502).json({ error: "Failed to fetch endpoints from upstream" });
  }
});

router.get("/categories", async (req, res): Promise<void> => {
  try {
    const data = await fetchUpstream();
    const merged = withAnimeCategory(buildCategories(data.endpoints ?? []));
    const categories = merged.map((c) => ({
      name: c.name,
      slug: c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      count: c.count,
      description: CATEGORY_DESCRIPTIONS[c.name] ?? `${c.name} endpoints`,
    }));
    const parsed = ListCategoriesResponse.safeParse({ categories, total: categories.length });
    res.json(parsed.success ? parsed.data : { categories, total: categories.length });
  } catch {
    res.status(502).json({ error: "Failed to fetch categories from upstream" });
  }
});

router.get("/status", async (req, res): Promise<void> => {
  try {
    const data = await fetchUpstream();
    const categories = withAnimeCategory(buildCategories(data.endpoints ?? []));
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
  } catch {
    res.status(502).json({ error: "Upstream unreachable" });
  }
});

export default router;
