/**
 * anime.js — WhatsApp bot command handler for CartoonsArea anime scraping.
 *
 * Flow:
 *   .anime <name>          → search results
 *   .anime <number>        → pick anime → show seasons
 *   .anime <number>        → pick season → show episodes
 *   .anime <number>        → pick episode → show quality options (from site)
 *   .anime <number>        → pick quality → show stream/download options
 *   .anime stream          → stream the video inline
 *   .anime download        → send as a downloadable document
 *
 * No local transcoding — source files are already well-compressed; re-encoding
 * only makes them larger and adds minutes of wait time. Quality options come
 * directly from the site (multiple qualities when available, auto-select when only one).
 *
 * FIXES:
 *   1. Cache cleared after successful send → bot accepts commands again immediately
 *   2. Processing lock → duplicate commands while downloading are blocked
 */

const fs   = require("fs");
const path = require("path");
const axios = require("axios");
const { spawn } = require("child_process");

const { searchAnime }                                    = require("./search");
const { formatSearch }                                   = require("./formatter");
const { setUserAnime, getUserAnime, clearUserAnime }     = require("./cache");
const { getSeasons }                                     = require("./seasons");
const { getEpisodes }                                    = require("./episodes");
const { getDownloadLinks }                               = require("./download");

// ─── Local quality presets ─────────────────────────────────────────────────────
// These use a TARGET BITRATE (not CRF) so the output is always smaller than
// the source, regardless of how compressed the original already is.
// ultrafast preset keeps encoding time to ~60-90s on a typical VPS.
const LOCAL_PRESETS = [
    { label: "720p (~40 MB)",  scale: "-2:720",  videoBitrate: "400k", audioBitrate: "96k"  },
    { label: "480p (~20 MB)",  scale: "-2:480",  videoBitrate: "200k", audioBitrate: "64k"  },
    { label: "360p (~10 MB)",  scale: "-2:360",  videoBitrate: "110k", audioBitrate: "64k"  },
];

/**
 * Transcode a local MP4 to a target resolution using ffmpeg.
 * Uses target bitrate so the output is always smaller than the source.
 */
async function transcodeVideo(srcPath, preset) {
    const destPath = srcPath.replace(/\.mp4$/i, `-${preset.label.split(" ")[0]}.mp4`);

    return new Promise((resolve, reject) => {
        const args = [
            "-i", srcPath,
            "-vf", `scale=${preset.scale}:force_original_aspect_ratio=decrease`,
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-b:v", preset.videoBitrate,
            "-c:a", "aac",
            "-b:a", preset.audioBitrate,
            "-movflags", "+faststart",
            "-y",
            destPath,
        ];

        const proc = spawn("ffmpeg", args, { stdio: "ignore" });

        proc.on("close", (code) => {
            if (code === 0) resolve(destPath);
            else reject(new Error(`ffmpeg exited with code ${code}`));
        });

        proc.on("error", (err) => {
            reject(new Error(`ffmpeg not found: ${err.message}. Install it with: sudo apt install ffmpeg`));
        });
    });
}

// ─── Storage directory ─────────────────────────────────────────────────────────
const MAX_FILE_AGE_MS     = 10 * 60 * 1000;
const CLEANUP_INTERVAL_MS =  5 * 60 * 1000;

function tryMkdir(dir) {
    try {
        fs.mkdirSync(dir, { recursive: true });
        const testFile = path.join(dir, ".write_test");
        fs.writeFileSync(testFile, "ok");
        fs.unlinkSync(testFile);
        return true;
    } catch (_) {
        return false;
    }
}

const PREFERRED = "/container/trust";
const FALLBACK  = path.join(__dirname, "trust_storage");

let TRUST_DIR;
if (tryMkdir(PREFERRED)) {
    TRUST_DIR = PREFERRED;
    console.log("[anime] Storage: using", PREFERRED);
} else {
    fs.mkdirSync(FALLBACK, { recursive: true });
    TRUST_DIR = FALLBACK;
    console.log("[anime] /container/trust not writable — falling back to", FALLBACK);
}

process.env.TMPDIR = TRUST_DIR;
process.env.TMP    = TRUST_DIR;
process.env.TEMP   = TRUST_DIR;
console.log("[anime] TMPDIR redirected to", TRUST_DIR);

// ─── Periodic cleanup ─────────────────────────────────────────────────────────

function cleanOldFiles() {
    try {
        const now = Date.now();
        for (const file of fs.readdirSync(TRUST_DIR)) {
            const filePath = path.join(TRUST_DIR, file);
            try {
                const stat = fs.statSync(filePath);
                if (now - stat.mtimeMs > MAX_FILE_AGE_MS) fs.unlinkSync(filePath);
            } catch (_) {}
        }
    } catch (_) {}
}

setInterval(cleanOldFiles, CLEANUP_INTERVAL_MS).unref();
cleanOldFiles();

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function downloadToTrust(url, filename) {
    const destPath = path.join(TRUST_DIR, filename);

    const response = await axios.get(url, {
        responseType: "stream",
        timeout: 0,
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Referer":    "https://www.cartoonsarea.cc/",
        },
    });

    const destStream = fs.createWriteStream(destPath);
    response.data.pipe(destStream);

    await new Promise((resolve, reject) => {
        destStream.on("finish", resolve);
        destStream.on("error", reject);
        response.data.on("error", reject);
    });

    return destPath;
}

function safeFilename(title) {
    return title
        .replace(/[^a-zA-Z0-9 _\-]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 80) + "-" + Date.now() + ".mp4";
}

// ─── Command handler ───────────────────────────────────────────────────────────

async function animeCommand(conn, m, args) {
    const from = m.key.remoteJid;

    const HELP_TEXT =
`📺 *Anime Bot — Commands*
━━━━━━━━━━━━━━━━━━━━━
🔍 *Search*
  .anime <name>
  Example: .anime one piece

🔢 *After searching*
  .anime 1  → pick anime from results
  .anime 1  → pick season
  .anime 1  → pick episode
  .anime 1  → pick quality (original / 720p / 480p / 360p)

▶️ *After picking quality*
  .anime stream   → play video inline
  .anime download → save as a file

ℹ️ *Other*
  .anime help     → show this list
━━━━━━━━━━━━━━━━━━━━━
💡 Each step waits for your reply — no timeouts for 30 min.`;

    if (!args.length || input === "help") {
        return conn.sendMessage(from, { text: HELP_TEXT });
    }

    const cache    = getUserAnime(from);
    const input    = args.join(" ").toLowerCase().trim();
    const num      = parseInt(args[0], 10);
    const isNumber = !isNaN(num) && args.length === 1;

    // ══════════════════════════════════════════════════════
    // STEP 5: Stream or download the chosen quality
    // ══════════════════════════════════════════════════════
    if (cache && cache.step === "action") {

        // Processing lock — block duplicate sends while a job is already running
        if (cache.processing) {
            return conn.sendMessage(from, {
                text: "⏳ Still downloading… please wait until the video arrives."
            });
        }

        if (input === "stream" || input === "download") {
            // Acquire lock immediately
            setUserAnime(from, { ...cache, processing: true });

            await conn.sendMessage(from, { text: "⏳ Downloading episode… please wait." });

            const { selectedLink, anime, season, episode } = cache;
            const filename = safeFilename(
                `${anime.title}-${episode.title}-${selectedLink.label}`
            );
            let localPath     = null;
            let transcodedPath = null;

            try {
                localPath = await downloadToTrust(selectedLink.url, filename);

                // Transcode if a local preset was chosen
                let sendPath    = localPath;
                let qualityLabel = selectedLink.label;

                if (selectedLink.preset) {
                    await conn.sendMessage(from, {
                        text: `⚙️ Compressing to ${selectedLink.preset.label.split(" ")[0]}… ~60-90 seconds.`
                    });
                    transcodedPath = await transcodeVideo(localPath, selectedLink.preset);
                    sendPath = transcodedPath;
                }

                const caption =
`🎬 ${anime.title}
📀 ${season.title}
🎞 ${episode.title}
📊 ${qualityLabel}`;

                if (input === "stream") {
                    await conn.sendMessage(from, {
                        video:    fs.readFileSync(sendPath),
                        mimetype: "video/mp4",
                        caption,
                    }, { quoted: m });
                } else {
                    await conn.sendMessage(from, {
                        document: fs.readFileSync(sendPath),
                        mimetype: "video/mp4",
                        fileName: `${anime.title} - ${episode.title} [${qualityLabel}].mp4`,
                    }, { quoted: m });
                }

                // FIX: clear session → next command works immediately
                clearUserAnime(from);

            } catch (err) {
                // Release lock on error so the user can retry
                setUserAnime(from, { ...cache, processing: false });
                await conn.sendMessage(from, {
                    text: `❌ Failed: ${err.message}\n\nTry again:\n  .anime stream\n  .anime download`
                });
            } finally {
                if (localPath      && fs.existsSync(localPath))      fs.unlinkSync(localPath);
                if (transcodedPath && fs.existsSync(transcodedPath)) fs.unlinkSync(transcodedPath);
            }

            return;
        }

        return conn.sendMessage(from, {
            text:
`❌ Invalid option.

Reply with:
  .anime stream
  .anime download`
        });
    }

    // ══════════════════════════════════════════════════════
    // STEP 4: Pick a quality (only shown if site offers multiple)
    // ══════════════════════════════════════════════════════
    if (cache && cache.step === "quality" && isNumber) {
        const selected = (cache.qualityOptions || [])[num - 1];

        if (!selected) {
            return conn.sendMessage(from, { text: "❌ Invalid quality number. Try again." });
        }

        setUserAnime(from, { ...cache, selectedLink: selected, step: "action" });

        const note = selected.preset
            ? "\n⏱ Compression takes ~60-90 seconds after download."
            : "";

        return conn.sendMessage(from, {
            text:
`✅ *${selected.label}* selected${note}

Choose what to do:
  .anime stream   — play inline
  .anime download — save as file`
        });
    }

    // ══════════════════════════════════════════════════════
    // STEP 3: Pick an episode
    // ══════════════════════════════════════════════════════
    if (cache && cache.step === "episode" && isNumber) {
        const episode = cache.episodes[num - 1];

        if (!episode) {
            return conn.sendMessage(from, { text: "❌ Invalid episode number." });
        }

        await conn.sendMessage(from, { text: "⏳ Fetching quality options…" });

        const siteLinks = await getDownloadLinks(episode.url);

        if (!siteLinks.length) {
            return conn.sendMessage(from, {
                text: "❌ Could not find download links for this episode. Try a different episode."
            });
        }

        // Build combined list: site qualities first, then local presets
        // Best source for local presets = highest quality from site (last after sort)
        const bestUrl = siteLinks[siteLinks.length - 1].url;

        const qualityOptions = [
            // Site-provided (send as-is, no transcoding)
            ...siteLinks.map((l) => ({
                label:  l.quality.toUpperCase() + " (original)",
                url:    l.url,
                preset: null,
            })),
            // Local presets (download bestUrl then transcode)
            ...LOCAL_PRESETS
                .filter((p) => {
                    // Skip preset if site already offers that exact resolution
                    const res = p.label.split(" ")[0].toLowerCase();
                    return !siteLinks.some((l) => l.quality.toLowerCase() === res);
                })
                .map((p) => ({
                    label:  p.label,
                    url:    bestUrl,
                    preset: p,
                })),
        ];

        setUserAnime(from, { ...cache, episode, qualityOptions, step: "quality" });

        let text = `🎞 *${episode.title}*\n\n📊 *Choose a quality:*\n\n`;
        qualityOptions.forEach((opt, i) => {
            text += `${i + 1}. ${opt.label}\n`;
        });
        text += "\n━━━━━━━━━━━━━━";
        text += "\nReply with: .anime <quality number>";

        return conn.sendMessage(from, { text });
    }

    // ══════════════════════════════════════════════════════
    // STEP 2: Pick a season
    // ══════════════════════════════════════════════════════
    if (cache && cache.step === "season" && isNumber) {
        const season = cache.seasons[num - 1];

        if (!season) {
            return conn.sendMessage(from, { text: "❌ Invalid season number." });
        }

        await conn.sendMessage(from, { text: "⏳ Fetching episodes…" });

        const episodes = await getEpisodes(season.url);

        if (!episodes.length) {
            return conn.sendMessage(from, {
                text: `📀 *${season.title}*\n\n❌ No episodes found.`
            });
        }

        setUserAnime(from, { ...cache, season, episodes, step: "episode" });

        let text = `🎬 *${cache.anime.title}*\n📀 *${season.title}*\n\n`;
        episodes.forEach((ep) => { text += `${ep.id}. ${ep.title}\n`; });
        text += "\n━━━━━━━━━━━━━━\nReply with: .anime <episode number>";

        return conn.sendMessage(from, { text });
    }

    // ══════════════════════════════════════════════════════
    // STEP 1: Pick an anime from search results
    // ══════════════════════════════════════════════════════
    if (cache && cache.step === "search" && cache.results && isNumber) {
        const index = num - 1;

        if (index < 0 || index >= cache.results.length) {
            return conn.sendMessage(from, { text: "❌ Invalid selection." });
        }

        const anime = cache.results[index];

        await conn.sendMessage(from, { text: "⏳ Fetching seasons…" });

        const seasons = await getSeasons(anime.url);

        if (!seasons.length) {
            return conn.sendMessage(from, {
                text: `📺 *${anime.title}*\n\n❌ No seasons found.`
            });
        }

        setUserAnime(from, { anime, seasons, step: "season" });

        let text = `📺 *${anime.title}*\n\n`;
        seasons.forEach((s) => { text += `${s.id}. ${s.title}\n`; });
        text += "\n━━━━━━━━━━━━━━\nReply with: .anime <season number>";

        return conn.sendMessage(from, { text });
    }

    // ══════════════════════════════════════════════════════
    // SEARCH (no active session or session expired)
    // ══════════════════════════════════════════════════════
    if (isNumber) {
        return conn.sendMessage(from, {
            text: "❌ Session expired. Start a new search:\n  .anime <anime name>"
        });
    }

    const query = args.join(" ");

    await conn.sendMessage(from, { text: `🔍 Searching for *${query}*…` });

    const results = await searchAnime(query);

    if (!results.length) {
        return conn.sendMessage(from, {
            text: `❌ No results found for *${query}*.\n\nTry a different spelling or a more specific name.`
        });
    }

    setUserAnime(from, {
        results,
        anime:        null,
        seasons:      [],
        season:       null,
        episodes:     [],
        episode:      null,
        links:        [],
        selectedLink: null,
        step:         "search",
    });

    return conn.sendMessage(from, { text: formatSearch(results) });
}

module.exports = animeCommand;
