/**
 * seasons.js — Fetch seasons for a CartoonsArea anime series page.
 *
 * Season links use protocol-relative URLs like:
 *   //www.cartoonsarea.cc/Japanese-Dubbed-Videos/B-Subbed-Series/
 *   Bleach-Subbed-Videos/Bleach-Season-01-Subbed-Videos/
 *
 * Titles come back as e.g. "Bleach Season 01 Subbed Videos" — we clean
 * them to "Season 1" for a cleaner bot display.
 */

const axios = require("axios");
const cheerio = require("cheerio");

const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
};

/**
 * Clean a raw season title like "Bleach Season 01 Subbed Videos"
 * into something readable like "Season 1".
 */
function cleanSeasonTitle(raw) {
    // Extract "Season N" from anywhere in the string
    const m = raw.match(/Season\s*(\d+)/i);
    if (m) return `Season ${parseInt(m[1], 10)}`;
    return raw
        .replace(/[-\s]*(Subbed|Dubbed)[-\s]*Videos?/gi, "")
        .replace(/-/g, " ")
        .trim();
}

async function getSeasons(url) {
    try {
        const { data } = await axios.get(url, {
            headers: { ...HEADERS, Referer: "https://www.cartoonsarea.cc/" },
            timeout: 15000,
        });

        const $ = cheerio.load(data);

        const seasons = [];
        const seenUrls = new Set();

        $("a[href]").each((_, el) => {
            const href = $(el).attr("href") || "";
            const text = $(el).text().trim();

            if (!href || !text) return;

            // Must look like a season page in both href and link text
            if (!/Season/i.test(href)) return;
            if (!/Season/i.test(text)) return;
            // Exclude episode-level links
            if (/Episode|\d+\.mp4/i.test(href)) return;

            // Resolve protocol-relative and relative URLs
            let seasonUrl;
            try {
                seasonUrl = new URL(href, "https://www.cartoonsarea.cc").href;
            } catch {
                return;
            }

            if (seenUrls.has(seasonUrl)) return;
            seenUrls.add(seasonUrl);

            seasons.push({
                id: seasons.length + 1,
                title: cleanSeasonTitle(text),
                url: seasonUrl,
            });
        });

        return seasons;
    } catch (err) {
        console.error("[seasons] Error:", err.message);
        return [];
    }
}

module.exports = { getSeasons };
