/**
 * episodes.js — Fetch episode list from a CartoonsArea season page.
 *
 * The site uses two different URL patterns across seasons:
 *
 *   Modern (Season 17+):
 *     //www.cartoonsarea.cc/.../Bleach-Season-17.../Episode-367/
 *
 *   Legacy (Season 1–16 and many other anime):
 *     //www.cartoonsarea.cc/.../One-Piece-Season-01.../One-Piece-Episode-01-Subbed-Video/
 *
 * Both are intermediate "folder" pages. Inside each folder is a .mp4.php link.
 * download.js handles fetching that .mp4.php page and extracting the real MP4.
 */

const axios = require("axios");
const cheerio = require("cheerio");

const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
};

/**
 * Returns true if the href looks like an episode folder link
 * (either modern or legacy URL pattern, never a .mp4 file itself).
 */
function isEpisodeFolder(href) {
    if (!href) return false;
    // Never match actual media files
    if (/\.mp4|\.mkv|\.avi|\.webm/i.test(href)) return false;
    // Modern:  .../Episode-367/
    if (/\/Episode-\d+\/?$/i.test(href)) return true;
    // Legacy:  .../One-Piece-Episode-01-Subbed-Video/
    //          .../Bleach-Episode-001-Sub/  etc.
    if (/Episode-\d+[^/]*\/?$/i.test(href)) return true;
    return false;
}

/**
 * Parse an episode number from the href or link text for sorting.
 */
function parseEpNumber(href, text) {
    const m = href.match(/Episode-0*(\d+)/i) || text.match(/Episode\s*0*(\d+)/i);
    return m ? parseInt(m[1], 10) : 9999;
}

async function getEpisodes(url) {
    try {
        const { data } = await axios.get(url, {
            headers: { ...HEADERS, Referer: "https://www.cartoonsarea.cc/" },
            timeout: 15000,
        });

        const $ = cheerio.load(data);

        const episodes = [];
        const seenUrls = new Set();

        $("a[href]").each((_, el) => {
            const href = $(el).attr("href") || "";
            const rawText = $(el).text().trim();

            if (!isEpisodeFolder(href)) return;

            let episodeUrl;
            try {
                episodeUrl = new URL(href, "https://www.cartoonsarea.cc").href;
            } catch {
                return;
            }

            if (seenUrls.has(episodeUrl)) return;
            seenUrls.add(episodeUrl);

            // Title: use link text if meaningful, otherwise derive from href
            const title = rawText ||
                (() => {
                    const m = href.match(/Episode-0*(\d+)/i);
                    return m ? `Episode ${parseInt(m[1], 10)}` : "Episode";
                })();

            episodes.push({
                id: 0, // assigned after sort
                title,
                url: episodeUrl,
                _epNum: parseEpNumber(href, rawText),
            });
        });

        // Sort numerically and assign sequential IDs
        episodes.sort((a, b) => a._epNum - b._epNum);
        episodes.forEach((ep, i) => {
            ep.id = i + 1;
            delete ep._epNum;
        });

        return episodes;
    } catch (err) {
        console.error("[episodes] Error:", err.message);
        return [];
    }
}

module.exports = { getEpisodes };
