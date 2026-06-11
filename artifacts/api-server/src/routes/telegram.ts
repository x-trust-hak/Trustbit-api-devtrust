import { Router, type IRouter, type Request, type Response } from "express";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const router: IRouter = Router();

const TOKEN = process.env["TELEGRAM_BOT_TOKEN"] ?? "8668026671:AAFHASz22T95kcIuVtzSawwkTerJxxwAzuY";
const TG = `https://api.telegram.org/bot${TOKEN}`;
const SELF = `http://localhost:${process.env["PORT"] ?? 8080}/api`;
const ADMIN_KEY = process.env["ADMIN_KEY"] ?? "trustbit-admin-2026";

/* ── Persistent user store ── */
const STORE_PATH = join(process.cwd(), "tg-users.json");

function loadUsers(): Set<number> {
  try {
    if (existsSync(STORE_PATH)) {
      const ids = JSON.parse(readFileSync(STORE_PATH, "utf8")) as number[];
      return new Set(ids);
    }
  } catch { /* ignore */ }
  return new Set();
}

function saveUsers(users: Set<number>): void {
  try { writeFileSync(STORE_PATH, JSON.stringify([...users])); } catch { /* ignore */ }
}

const registeredUsers = loadUsers();

function registerUser(chatId: number): void {
  if (!registeredUsers.has(chatId)) {
    registeredUsers.add(chatId);
    saveUsers(registeredUsers);
  }
}

async function tgPost(method: string, body: Record<string, unknown>): Promise<void> {
  if (!TOKEN) return;
  await fetch(`${TG}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => null);
}

async function sendText(chatId: number, text: string, extra?: Record<string, unknown>): Promise<void> {
  await tgPost("sendMessage", { chat_id: chatId, text, parse_mode: "Markdown", ...extra });
}

async function sendPhoto(chatId: number, photo: string, caption?: string): Promise<void> {
  await tgPost("sendPhoto", { chat_id: chatId, photo, caption, parse_mode: "Markdown" });
}

async function sendAudio(chatId: number, audio: string, caption?: string): Promise<void> {
  await tgPost("sendAudio", { chat_id: chatId, audio, caption });
}

async function sendVoice(chatId: number, voice: string): Promise<void> {
  await tgPost("sendVoice", { chat_id: chatId, voice });
}

async function callApi(path: string): Promise<globalThis.Response> {
  return fetch(`${SELF}${path}`, { signal: AbortSignal.timeout(20000) });
}

function extractField(data: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = data[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return undefined;
}

async function handleMessage(chatId: number, text: string): Promise<void> {
  registerUser(chatId);

  const parts = text.trim().split(/\s+/);
  const cmd = (parts[0] ?? "").toLowerCase().split("@")[0] ?? "";
  const arg = parts.slice(1).join(" ").trim();

  switch (cmd) {
    case "/start":
    case "/help": {
      await sendText(chatId,
        `🤖 *TrustbitAPI Bot*\n\n` +
        `Access 545+ APIs directly from Telegram!\n\n` +
        `*Commands:*\n` +
        `/ai <prompt> — AI chat response\n` +
        `/img <prompt> — Generate an image\n` +
        `/tts <text> — Text to speech\n` +
        `/tiktok <url> — Download TikTok\n` +
        `/youtube <query> — Search YouTube\n` +
        `/anime — Random anime gif\n` +
        `/hug — Anime hug gif\n` +
        `/pat — Anime pat gif\n` +
        `/cat — Random cat image\n` +
        `/dog — Random dog image\n` +
        `/fact — AI-generated fact\n` +
        `/joke — AI-generated joke\n` +
        `/stats — Live platform stats\n\n` +
        `*Admin Only:*\n` +
        `/broadcast <key> <msg> — Send to all users\n` +
        `/users <key> — Total registered users\n\n` +
        `Powered by *TrustbitAPI* 🚀\n` +
        `Channel: @TrustBitOfficial`
      );
      break;
    }

    case "/ai": {
      if (!arg) { await sendText(chatId, "Usage: `/ai <your question>`"); return; }
      await sendText(chatId, "⏳ Thinking...");
      try {
        const res = await callApi(`/ai/aichat?prompt=${encodeURIComponent(arg)}`);
        const data = await res.json() as Record<string, unknown>;
        const reply = extractField(data, "response", "result", "text", "answer", "message") ?? JSON.stringify(data);
        await sendText(chatId, String(reply).slice(0, 4000));
      } catch {
        await sendText(chatId, "❌ AI request failed. Try again.");
      }
      break;
    }

    case "/img": {
      if (!arg) { await sendText(chatId, "Usage: `/img <description>`"); return; }
      await sendText(chatId, "⏳ Generating image...");
      try {
        const res = await callApi(`/ai/aiwriter-image?prompt=${encodeURIComponent(arg)}`);
        const data = await res.json() as Record<string, unknown>;
        const url = extractField(data, "url", "image", "result", "output", "link");
        if (url && url.startsWith("http")) {
          await sendPhoto(chatId, url, `🎨 ${arg.slice(0, 200)}`);
        } else {
          await sendText(chatId, "❌ Could not generate image. Try a different prompt.");
        }
      } catch {
        await sendText(chatId, "❌ Image generation failed.");
      }
      break;
    }

    case "/tts": {
      if (!arg) { await sendText(chatId, "Usage: `/tts <text to speak>`"); return; }
      await sendText(chatId, "⏳ Converting to speech...");
      try {
        const encoded = encodeURIComponent(arg);
        const res = await callApi(`/tts/tts-adult-female--1-american-english-truvoice?text=${encoded}`);
        const ct = res.headers.get("content-type") ?? "";
        if (ct.includes("audio") || ct.includes("octet-stream")) {
          const buf = Buffer.from(await res.arrayBuffer());
          const b64 = buf.toString("base64");
          const dataUrl = `data:audio/mpeg;base64,${b64}`;
          await sendVoice(chatId, dataUrl);
        } else {
          const data = await res.json() as Record<string, unknown>;
          const url = extractField(data, "url", "audio", "link", "result");
          if (url && url.startsWith("http")) {
            await sendAudio(chatId, url, arg.slice(0, 100));
          } else {
            await sendText(chatId, "❌ TTS failed. Try shorter text.");
          }
        }
      } catch {
        await sendText(chatId, "❌ TTS request failed.");
      }
      break;
    }

    case "/tiktok": {
      if (!arg) { await sendText(chatId, "Usage: `/tiktok <video url>`"); return; }
      await sendText(chatId, "⏳ Fetching TikTok...");
      try {
        const res = await callApi(`/download/tiktok?url=${encodeURIComponent(arg)}`);
        const data = await res.json() as Record<string, unknown>;
        const videoUrl = extractField(data, "video", "url", "download", "result", "play");
        const title = String(data["title"] ?? data["caption"] ?? data["desc"] ?? "TikTok Video").slice(0, 200);
        if (videoUrl && videoUrl.startsWith("http")) {
          await sendText(chatId, `🎵 *${title}*\n\n[▶️ Download Video](${videoUrl})`);
        } else {
          const v2 = await callApi(`/download/tiktokV2?url=${encodeURIComponent(arg)}`);
          const d2 = await v2.json() as Record<string, unknown>;
          const url2 = extractField(d2, "video", "url", "download", "play", "result");
          if (url2 && url2.startsWith("http")) {
            await sendText(chatId, `🎵 *TikTok Video*\n\n[▶️ Download Video](${url2})`);
          } else {
            await sendText(chatId, "❌ Could not fetch this TikTok. Make sure the URL is correct and the video is public.");
          }
        }
      } catch {
        await sendText(chatId, "❌ TikTok download failed.");
      }
      break;
    }

    case "/youtube": {
      if (!arg) { await sendText(chatId, "Usage: `/youtube <search query>`"); return; }
      await sendText(chatId, "⏳ Searching YouTube...");
      try {
        const res = await callApi(`/search/youtube?q=${encodeURIComponent(arg)}`);
        const data = await res.json() as Record<string, unknown>;
        const results = (data["results"] ?? data["data"] ?? data["videos"] ?? data["items"] ?? []) as Array<Record<string, unknown>>;
        if (Array.isArray(results) && results.length > 0) {
          const lines = results.slice(0, 5).map((r, i) => {
            const title = String(r["title"] ?? r["name"] ?? "Video").slice(0, 60);
            const vid = String(r["videoId"] ?? r["id"] ?? r["url"] ?? r["link"] ?? "");
            const url = vid.startsWith("http") ? vid : `https://youtube.com/watch?v=${vid}`;
            const views = r["viewCount"] ? ` · ${Number(r["viewCount"]).toLocaleString()} views` : "";
            return `${i + 1}. [${title}](${url})${views}`;
          });
          await sendText(chatId, `🎬 *YouTube: "${arg}"*\n\n${lines.join("\n")}`);
        } else {
          await sendText(chatId, `No YouTube results found for "${arg}".`);
        }
      } catch {
        await sendText(chatId, "❌ YouTube search failed.");
      }
      break;
    }

    case "/anime": {
      await sendText(chatId, "⏳ Getting anime gif...");
      try {
        const actions = ["hug", "pat", "dance", "cry", "happy", "blush", "cuddle", "wave"];
        const action = actions[Math.floor(Math.random() * actions.length)];
        const res = await callApi(`/anime/${action}`);
        const data = await res.json() as Record<string, unknown>;
        const url = extractField(data, "url", "image", "gif", "link", "result");
        if (url && url.startsWith("http")) {
          await sendPhoto(chatId, url, `✨ Anime ${action}!`);
        } else {
          await sendText(chatId, "❌ Could not fetch anime gif.");
        }
      } catch {
        await sendText(chatId, "❌ Anime request failed.");
      }
      break;
    }

    case "/hug": {
      try {
        const res = await callApi("/anime/hug");
        const data = await res.json() as Record<string, unknown>;
        const url = extractField(data, "url", "image", "gif", "link");
        if (url && url.startsWith("http")) {
          await sendPhoto(chatId, url, "🤗 Here's a hug for you!");
        } else { await sendText(chatId, "❌ No hug found!"); }
      } catch { await sendText(chatId, "❌ Failed to fetch hug."); }
      break;
    }

    case "/pat": {
      try {
        const res = await callApi("/anime/pat");
        const data = await res.json() as Record<string, unknown>;
        const url = extractField(data, "url", "image", "gif", "link");
        if (url && url.startsWith("http")) {
          await sendPhoto(chatId, url, "👋 Pat pat!");
        } else { await sendText(chatId, "❌ No pat found!"); }
      } catch { await sendText(chatId, "❌ Failed to fetch pat."); }
      break;
    }

    case "/cat": {
      try {
        const res = await callApi("/random/cat");
        const data = await res.json() as Record<string, unknown>;
        const url = extractField(data, "url", "image", "link", "result");
        if (url && url.startsWith("http")) {
          await sendPhoto(chatId, url, "🐱 Meow!");
        } else { await sendText(chatId, "❌ No cat found!"); }
      } catch { await sendText(chatId, "❌ Cat fetch failed."); }
      break;
    }

    case "/dog": {
      try {
        const res = await callApi("/random/dog");
        const data = await res.json() as Record<string, unknown>;
        const url = extractField(data, "url", "image", "link", "result");
        if (url && url.startsWith("http")) {
          await sendPhoto(chatId, url, "🐶 Woof!");
        } else { await sendText(chatId, "❌ No dog found!"); }
      } catch { await sendText(chatId, "❌ Dog fetch failed."); }
      break;
    }

    case "/fact": {
      await sendText(chatId, "⏳ Getting a fact...");
      try {
        const res = await callApi("/ai/aichat?prompt=" + encodeURIComponent("Give me one short, interesting random fact. Just the fact, no intro."));
        const data = await res.json() as Record<string, unknown>;
        const fact = extractField(data, "response", "result", "text", "answer") ?? "Could not get a fact.";
        await sendText(chatId, `💡 *Random Fact*\n\n${fact}`);
      } catch { await sendText(chatId, "❌ Could not get a fact."); }
      break;
    }

    case "/joke": {
      await sendText(chatId, "⏳ Getting a joke...");
      try {
        const res = await callApi("/ai/aichat?prompt=" + encodeURIComponent("Tell me one short funny joke. Just the joke, no intro."));
        const data = await res.json() as Record<string, unknown>;
        const joke = extractField(data, "response", "result", "text", "answer") ?? "Could not get a joke.";
        await sendText(chatId, `😄 *Random Joke*\n\n${joke}`);
      } catch { await sendText(chatId, "❌ Could not get a joke."); }
      break;
    }

    case "/broadcast": {
      const spaceIdx = arg.indexOf(" ");
      if (spaceIdx === -1) {
        await sendText(chatId, "Usage: `/broadcast <adminkey> <your message>`\n\nExample:\n`/broadcast trustbit-admin-2026 Hello everyone!`");
        return;
      }
      const givenKey = arg.slice(0, spaceIdx).trim();
      const message = arg.slice(spaceIdx + 1).trim();

      if (givenKey !== ADMIN_KEY) {
        await sendText(chatId, "❌ Invalid admin key.");
        return;
      }
      if (!message) {
        await sendText(chatId, "❌ Message cannot be empty.");
        return;
      }

      const total = registeredUsers.size;
      await sendText(chatId, `📢 Broadcasting to *${total}* user${total !== 1 ? "s" : ""}...\n\nMessage:\n_${message.slice(0, 200)}_`);

      let sent = 0, failed = 0;
      for (const uid of registeredUsers) {
        try {
          await tgPost("sendMessage", {
            chat_id: uid,
            text: `📢 *Announcement from TrustbitAPI*\n\n${message}\n\n— @TrustBitOfficial`,
            parse_mode: "Markdown",
          });
          sent++;
        } catch { failed++; }
        await new Promise((r) => setTimeout(r, 50));
      }

      await sendText(chatId, `✅ Broadcast complete!\n\n📤 Sent: *${sent}*\n❌ Failed: *${failed}*`);
      break;
    }

    case "/users": {
      const givenKey = arg.trim();
      if (givenKey !== ADMIN_KEY) {
        await sendText(chatId, "❌ Usage: `/users <adminkey>`");
        return;
      }
      await sendText(chatId, `👥 *Registered Bot Users*\n\n*Total:* ${registeredUsers.size} user${registeredUsers.size !== 1 ? "s" : ""}\n\n_These are users who have interacted with the bot._`);
      break;
    }

    case "/stats": {
      try {
        const res = await fetch(`${SELF}/admin/stats?key=trustbit-admin-2026`, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) { await sendText(chatId, "❌ Could not fetch stats."); return; }
        const s = await res.json() as {
          uptime: number; totalRequests: number; totalErrors: number;
          successRate: number; avgResponseMs: number; totalBytes: number;
          visitors?: { todayCount: number; weekCount: number; totalCount: number };
        };
        const uptime = (() => {
          const sec = s.uptime ?? 0;
          const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60);
          if (d > 0) return `${d}d ${h}h`;
          if (h > 0) return `${h}h ${m}m`;
          return `${m}m`;
        })();
        const bytes = (() => {
          const b = s.totalBytes ?? 0;
          if (b >= 1_048_576) return (b / 1_048_576).toFixed(1) + " MB";
          if (b >= 1024) return (b / 1024).toFixed(1) + " KB";
          return b + " B";
        })();
        const v = s.visitors;
        await sendText(chatId,
          `📊 *TrustbitAPI Live Stats*\n\n` +
          `⏱ *Uptime:* ${uptime}\n` +
          `📡 *Total Requests:* ${(s.totalRequests ?? 0).toLocaleString()}\n` +
          `✅ *Success Rate:* ${(s.successRate ?? 0).toFixed(1)}%\n` +
          `⚡ *Avg Response:* ${s.avgResponseMs ?? 0}ms\n` +
          `💾 *Data Served:* ${bytes}\n` +
          (v ? `\n👥 *Visitors Today:* ${v.todayCount}\n👥 *This Week:* ${v.weekCount}\n👥 *All Time:* ${v.totalCount}\n` : "") +
          `\n_Powered by TrustbitAPI_ 🚀`
        );
      } catch { await sendText(chatId, "❌ Stats request failed. Server may be restarting."); }
      break;
    }

    default: {
      if (cmd.startsWith("/")) {
        await sendText(chatId, `Unknown command: \`${cmd}\`\nSend /help to see all available commands.`);
      }
    }
  }
}

router.post("/telegram/webhook", (req: Request, res: Response): void => {
  res.json({ ok: true });
  if (!TOKEN) return;
  const update = req.body as { message?: { chat: { id: number }; text?: string } };
  const msg = update?.message;
  if (!msg?.text || !msg?.chat?.id) return;
  handleMessage(msg.chat.id, msg.text).catch(() => null);
});

router.get("/telegram/status", (_req: Request, res: Response): void => {
  res.json({ configured: Boolean(TOKEN) });
});

export default router;
