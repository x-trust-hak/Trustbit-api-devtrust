import { Router, type IRouter } from "express";
import { ListEndpointsResponse, ListCategoriesResponse, GetApiStatusResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const SOURCE_BASE = "https://apis.prexzyvilla.villa";
const UPSTREAM = "https://apis.prexzyvilla.site";

const EXCLUDED_CATEGORIES = ["NSFW Content"];

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "Artificial Intelligence": "Chat, reasoning, code generation, and AI model endpoints",
  "Image Generation": "Generate images in various artistic styles using AI",
  "Anime": "Anime search, streaming, episodes, and metadata",
  "Downloader": "Download media from popular platforms",
  "Games": "Game data, stats, and information endpoints",
  "Image Creator": "Create and manipulate images with custom overlays and effects",
  "Movies": "Movie and TV show search, details, and streaming data",
  "Search": "Search across the web and specialized content sources",
  "Random": "Random jokes, quotes, facts, memes, and more",
  "Audio": "Audio processing and conversion utilities",
  "Sports": "Live sports scores, standings, and match data",
  "Screenshot Website": "Capture full-page screenshots of any website",
  "Stalk": "Lookup information about social media profiles and platforms",
  "Text Maker": "Generate styled text images and effects",
  "Tools": "Utility tools for encoding, hashing, weather, and more",
  "Url Shortner": "Shorten URLs using various services",
  "StyleText": "Convert plain text into stylized Unicode fonts",
  "Text To Speech": "Convert text to audio using dozens of voice styles",
  "Virtual Number": "Access virtual phone numbers to receive SMS messages",
};

let cachedEndpoints: unknown = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function fetchUpstreamEndpoints(): Promise<unknown> {
  const now = Date.now();
  if (cachedEndpoints && now - cacheTime < CACHE_TTL) {
    return cachedEndpoints;
  }

  const response = await fetch(`${UPSTREAM}/endpoints`, {
    headers: { "User-Agent": "TrustbitAPI/1.0" },
    signal: AbortSignal.timeout(15000),
  });
  const data = (await response.json()) as { endpoints?: Array<{ name: string; items: Array<Record<string, { desc: string; path: string }>> }> };

  cachedEndpoints = data;
  cacheTime = now;
  return data;
}

router.get("/endpoints", async (req, res): Promise<void> => {
  try {
    const data = (await fetchUpstreamEndpoints()) as {
      endpoints?: Array<{ name: string; items: Array<Record<string, { desc: string; path: string }>> }>;
    };

    const rawCategories = data.endpoints ?? [];
    const filtered = rawCategories.filter((cat) => !EXCLUDED_CATEGORIES.includes(cat.name));

    const categoryMap = new Map<string, { name: string; count: number; items: { name: string; desc: string; path: string }[] }>();
    for (const cat of filtered) {
      const items = cat.items.map((item) => {
        const [name, info] = Object.entries(item)[0];
        return { name, desc: info.desc, path: info.path };
      });
      if (categoryMap.has(cat.name)) {
        const existing = categoryMap.get(cat.name)!;
        existing.items.push(...items);
        existing.count = existing.items.length;
      } else {
        categoryMap.set(cat.name, { name: cat.name, count: items.length, items });
      }
    }
    const categories = Array.from(categoryMap.values());

    const totalEndpoints = categories.reduce((acc, c) => acc + c.count, 0);

    const result = ListEndpointsResponse.parse({
      status: true,
      creator: "trustbit",
      totalEndpoints,
      categories,
    });

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch endpoints");
    res.status(502).json({ status: false, error: "Failed to retrieve endpoints" });
  }
});

router.get("/categories", async (req, res): Promise<void> => {
  try {
    const data = (await fetchUpstreamEndpoints()) as {
      endpoints?: Array<{ name: string; items: unknown[] }>;
    };

    const rawCategories = data.endpoints ?? [];
    const filtered = rawCategories.filter((cat) => !EXCLUDED_CATEGORIES.includes(cat.name));

    const seen = new Set<string>();
    const categories = filtered
      .filter((cat) => {
        if (seen.has(cat.name)) return false;
        seen.add(cat.name);
        return true;
      })
      .map((cat) => {
        const slug = cat.name
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");
        return {
          name: cat.name,
          slug,
          count: cat.items.length,
          description: CATEGORY_DESCRIPTIONS[cat.name] ?? cat.name + " endpoints",
        };
      });

    const result = ListCategoriesResponse.parse({
      status: true,
      categories,
      total: categories.length,
    });

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch categories");
    res.status(502).json({ status: false, error: "Failed to retrieve categories" });
  }
});

router.get("/status", async (_req, res): Promise<void> => {
  const result = GetApiStatusResponse.parse({
    status: "active",
    platform: "Trustbit API",
    totalEndpoints: 550,
    uptime: process.uptime(),
    version: "1.0.0",
  });
  res.json(result);
});

export default router;
