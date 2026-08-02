/**
 * search.js — CartoonsArea anime search
 *
 * Searches the alphabetical index pages for both Japanese and English dubbed
 * series. Much more reliable than scraping the homepage (which only shows
 * ~24 recent updates).
 *
 * URL structure:
 *   https://www.cartoonsarea.cc/Japanese-Dubbed-Videos/{LETTER}-Subbed-Series/
 *   https://www.cartoonsarea.cc/English-Dubbed-Videos/{LETTER}-Dubbed-Series/
 */

const axios = require("axios");
const cheerio = require("cheerio");

const BASE = "https://www.cartoonsarea.cc";

const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
};

/**
 * Search for an anime by name.
 * Tries the alphabetical index pages for the first letter of the query,
 * covering both Japanese and English dubbed libraries.
 */
async function searchAnime(query) {
    const clean = query.trim();
    if (!clean) return [];

    const letter = clean[0].toUpperCase();

    // Both libraries to check
    const indexUrls = [
        `${BASE}/Japanese-Dubbed-Videos/${letter}-Subbed-Series/`,
        `${BASE}/English-Dubbed-Videos/${letter}-Dubbed-Series/`,
    ];

    const results = [];
    const seenUrls = new Set();

    for (const indexUrl of indexUrls) {
        try {
            const { data } = await axios.get(indexUrl, {
                headers: HEADERS,
                timeout: 15000,
            });

            const $ = cheerio.load(data);

            $("a[href]").each((_, el) => {
                const href = $(el).attr("href") || "";
                const title = $(el).text().trim();

                if (!title || !href) return;

                // Must link to a series page (contains -Videos/ but not a season or episode)
                if (!/-Videos\/?$/.test(href)) return;
                if (/Season|Episode|\d+\.mp4/i.test(href)) return;

                // Must match the query
                if (!title.toLowerCase().includes(clean.toLowerCase())) return;

                // Build absolute URL — cartoonsarea uses protocol-relative //
                let url;
                try {
                    url = new URL(href, BASE).href;
                } catch {
                    return;
                }

                if (seenUrls.has(url)) return;
                seenUrls.add(url);

                // Get poster image from a sibling or parent img if present
                const img =
                    $(el).find("img").attr("src") ||
                    $(el).closest("td, li, div").find("img").attr("src") ||
                    "";

                const image = img
                    ? img.startsWith("http")
                        ? img
                        : img.startsWith("//")
                        ? "https:" + img
                        : BASE + img
                    : "";

                results.push({
                    id: results.length + 1,
                    title,
                    url,
                    image,
                    episode: "",
                    status: "Available",
                });
            });
        } catch (err) {
            // Index page might not exist for this letter in one library — skip silently
        }
    }

    return results;
}

module.exports = { searchAnime };
