/**
 * download.js — Extract ALL quality MP4 download links from a CartoonsArea episode.
 *
 * CartoonsArea has a 3-level structure:
 *   1. Episode-N/ folder page  → lists one .mp4.php file link PER quality
 *   2. .mp4.php page           → has <a class="download-btn" download href="/USER-DATA/…">
 *   3. /USER-DATA/…mp4         → the real MP4 file
 *
 * getDownloadLinks() fetches all .mp4.php pages in parallel and returns every
 * available quality as { quality, url } so the caller can let the user choose.
 */

const axios = require("axios");
const cheerio = require("cheerio");

const BASE = "https://www.cartoonsarea.cc";

const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.cartoonsarea.cc/",
};

// Quality order for sorting (lowest first so users see data-saving options first)
const QUALITY_ORDER = ["144p", "240p", "360p", "480p", "720p", "1080p", "1440p", "2160p", "hd", "sd"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toAbsolute(href, pageUrl) {
    if (!href) return null;
    if (href.startsWith("http")) return href;
    if (href.startsWith("//")) return "https:" + href;
    try { return new URL(href, pageUrl || BASE).href; } catch { return null; }
}

async function fetchHtml(url, referer) {
    const res = await axios.get(url, {
        headers: { ...HEADERS, ...(referer ? { Referer: referer } : {}) },
        timeout: 20000,
        maxRedirects: 15,
        responseType: "text",
    });
    const finalUrl = res.request?.res?.responseUrl || url;
    return { html: res.data, finalUrl };
}

async function fetchWithRetry(url, referer) {
    try {
        return await fetchHtml(url, referer);
    } catch {
        await new Promise((r) => setTimeout(r, 1200));
        return await fetchHtml(url, referer);
    }
}

/**
 * Parses a quality label (e.g. "360p", "1080p") from a URL or link text.
 * Falls back to "HD" if nothing is found.
 */
function parseQuality(url, linkText) {
    // Try the link text first (most reliable on CartoonsArea)
    const fromText = (linkText || "").match(/(\d{3,4}p)/i);
    if (fromText) return fromText[1].toLowerCase();

    // Then try the URL
    const fromUrl = url.match(/(\d{3,4}p)/i);
    if (fromUrl) return fromUrl[1].toLowerCase();

    // Fallback labels in the filename
    if (/\b(hd|high)\b/i.test(url)) return "HD";
    if (/\b(sd|low)\b/i.test(url))  return "SD";

    return "HD";
}

function qualitySortKey(q) {
    const idx = QUALITY_ORDER.indexOf(q.toLowerCase());
    return idx === -1 ? 99 : idx;
}

// ─── Extractors ───────────────────────────────────────────────────────────────

/**
 * Finds ALL .mp4.php links on an Episode-N/ folder page.
 * Returns an array of { phpUrl, quality } objects.
 */
function extractPhpLinks(html, pageUrl) {
    const $ = cheerio.load(html);
    const seen = new Set();
    const links = [];

    $("a[href]").each((_, el) => {
        const href  = $(el).attr("href") || "";
        const label = $(el).text().trim();
        if (/\.mp4\.php/i.test(href)) {
            const abs = toAbsolute(href, pageUrl);
            if (abs && !seen.has(abs)) {
                seen.add(abs);
                links.push({ phpUrl: abs, quality: parseQuality(href, label) });
            }
        }
    });

    // Regex fallback if cheerio found nothing
    if (!links.length) {
        const rx = /href="([^"]+\.mp4\.php)"/gi;
        let m;
        while ((m = rx.exec(html)) !== null) {
            const abs = toAbsolute(m[1], pageUrl);
            if (abs && !seen.has(abs)) {
                seen.add(abs);
                links.push({ phpUrl: abs, quality: parseQuality(abs, "") });
            }
        }
    }

    return links;
}

/**
 * Extracts the direct /USER-DATA/ MP4 href from a .mp4.php page.
 */
function extractMp4Link(html, pageUrl) {
    const $ = cheerio.load(html);

    let link =
        $("a.download-btn[download]").attr("href") ||
        $("a.download-btn").attr("href") ||
        $("[class*='download-btn']").attr("href") ||
        $("a[download][href*='/USER-DATA/']").attr("href") ||
        $("a[href*='/USER-DATA/']").attr("href") ||
        $("a[href*='/user-data/']").attr("href");

    if (link) return toAbsolute(link, pageUrl);

    $("a[href]").each((_, el) => {
        if (link) return;
        const href = $(el).attr("href") || "";
        if (/\/USER-DATA\//i.test(href)) link = href;
    });
    if (link) return toAbsolute(link, pageUrl);

    const m =
        html.match(/href="([^"]*\/USER-DATA\/[^"]+\.(?:mp4|mkv|webm)[^"]*)"[^>]*download/i) ||
        html.match(/href="([^"]*\/USER-DATA\/[^"]+\.(?:mp4|mkv|webm)[^"]*)"/i) ||
        html.match(/["'](\/USER-DATA\/[^"']+\.(?:mp4|mkv|webm)[^"']*?)["']/i);
    if (m?.[1]) return toAbsolute(m[1], pageUrl);

    return null;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Given an Episode-N/ folder URL or a .mp4.php URL, returns every available
 * quality as an array of { quality, url } sorted lowest-quality first.
 *
 * @param {string} url
 * @returns {Promise<Array<{ quality: string, url: string }>>}
 */
async function getDownloadLinks(url) {
    try {
        let phpEntries = []; // [{ phpUrl, quality }]
        let phpReferer = url;

        if (/\.mp4\.php/i.test(url)) {
            // Caller passed a direct .mp4.php URL — treat it as a single entry
            phpEntries = [{ phpUrl: url, quality: parseQuality(url, "") }];
        } else {
            // Folder page — find ALL .mp4.php links (one per quality)
            const { html: folderHtml, finalUrl: folderFinal } = await fetchWithRetry(url);
            phpEntries = extractPhpLinks(folderHtml, folderFinal);
            phpReferer = folderFinal;

            if (!phpEntries.length) {
                console.error("[download] No .mp4.php links found on folder page:", url);
                return [];
            }
        }

        // Fetch all .mp4.php pages in parallel to resolve the direct MP4 URLs
        const settled = await Promise.allSettled(
            phpEntries.map(async ({ phpUrl, quality }) => {
                const { html: phpHtml, finalUrl: phpFinal } = await fetchWithRetry(phpUrl, phpReferer);
                const mp4Url = extractMp4Link(phpHtml, phpFinal);
                if (!mp4Url) return null;

                // Refine quality from the actual mp4 URL if the .php label was generic
                const refinedQuality = quality === "HD"
                    ? parseQuality(mp4Url, "")
                    : quality;

                return { quality: refinedQuality, url: mp4Url };
            })
        );

        const links = settled
            .filter(r => r.status === "fulfilled" && r.value)
            .map(r => r.value);

        if (!links.length) {
            console.error("[download] No /USER-DATA/ links resolved for:", url);
            return [];
        }

        // Deduplicate by URL and sort lowest quality first
        const seen = new Set();
        const unique = links.filter(l => {
            if (seen.has(l.url)) return false;
            seen.add(l.url);
            return true;
        });

        unique.sort((a, b) => qualitySortKey(a.quality) - qualitySortKey(b.quality));

        return unique;
    } catch (err) {
        console.error("[download] Error:", err.message);
        return [];
    }
}

module.exports = { getDownloadLinks };
