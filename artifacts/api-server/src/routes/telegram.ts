import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const TOKEN = process.env["TELEGRAM_BOT_TOKEN"] ?? "";
const TG = `https://api.telegram.org/bot${TOKEN}`;
const SELF = `http://localhost:${process.env["PORT"] ?? 8080}/api`;

async function tgPost(method: string, body: Record<string, unknown>): Promise<void> {
  if (!TOKEN) return;
  await fetch(`${TG}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => null);
}

async function sendText(chatId: number, text: string): Promise<void> {
  await tgPost("sendMessage", { chat_id: chatId, text, parse_mode: "Markdown" });
}

async function sendPhoto(chatId: number, photo: string, caption?: string): Promise<void> {
  await tgPost("sendPhoto", { chat_id: chatId, photo, caption });
}

async function sendAudio(chatId: number, audio: string, caption?: string): Promise<void> {
  await tgPost("sendAudio", { chat_id: chatId, audio, caption });
}

async function callApi(path: string): Promise<Response> {
  return fetch(`${SELF}${path}`);
}

async function handleMessage(chatId: number, text: string): Promise<void> {
  const parts = text.trim().split(/\s+/);
  const cmd = (parts[0] ?? "").toLowerCase().split("@")[0];
  const arg = parts.slice(1).join(" ").trim();

  switch (cmd) {
    case "/start":
    case "/help": {
      await sendText(chatId,
        `🤖 *TrustbitAPI Bot*\n\n` +
        `Call 545+ APIs directly from Telegram!\n\n` +
        `*Commands:*\n` +
        `/ai <prompt> — AI chat assistant\n` +
        `/img <prompt> — Generate an image\n` +
        `/tts <text> — Text to speech (English)\n` +
        `/tiktok <url> — Download TikTok video\n` +
        `/youtube <query> — YouTube search\n` +
        `/anime <query> — Anime search\n` +
        `/fact — Random fun fact\n` +
        `/joke — Random joke\n` +
        `/cat — Random cat image\n` +
        `/dog — Random dog image\n\n` +
        `Powered by *TrustbitAPI* 🚀`
      );
      break;
    }

    case "/ai": {
      if (!arg) { await sendText(chatId, "Usage: /ai <your question>"); return; }
      await sendText(chatId, "⏳ Thinking...");
      try {
        const res = await callApi(`/ai/aichat?prompt=${encodeURIComponent(arg)}`);
        const data = await res.json() as Record<string, unknown>;
        const reply = (data["response"] ?? data["result"] ?? data["text"] ?? data["answer"] ?? JSON.stringify(data)) as string;
        await sendText(chatId, String(reply).slice(0, 4000));
      } catch {
        await sendText(chatId, "❌ AI request failed. Try again.");
      }
      break;
    }

    case "/img": {
      if (!arg) { await sendText(chatId, "Usage: /img <description>"); return; }
      await sendText(chatId, "⏳ Generating image...");
      try {
        const res = await callApi(`/ai/imagine?prompt=${encodeURIComponent(arg)}`);
        const data = await res.json() as Record<string, unknown>;
        const url = (data["url"] ?? data["image"] ?? data["result"]) as string | undefined;
        if (url) {
          await sendPhoto(chatId, url, arg);
        } else {
          await sendText(chatId, "❌ Could not generate image. Try a different prompt.");
        }
      } catch {
        await sendText(chatId, "❌ Image generation failed.");
      }
      break;
    }

    case "/tts": {
      if (!arg) { await sendText(chatId, "Usage: /tts <text to speak>"); return; }
      await sendText(chatId, "⏳ Converting to speech...");
      try {
        const res = await callApi(`/tts/tts-en?text=${encodeURIComponent(arg)}`);
        const ct = res.headers.get("content-type") ?? "";
        if (ct.includes("audio")) {
          const url = res.url || `${SELF}/tts/tts-en?text=${encodeURIComponent(arg)}`;
          await sendAudio(chatId, url, arg.slice(0, 100));
        } else {
          const data = await res.json() as Record<string, unknown>;
          const url = (data["url"] ?? data["audio"] ?? data["link"]) as string | undefined;
          if (url) {
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
      if (!arg) { await sendText(chatId, "Usage: /tiktok <video url>"); return; }
      await sendText(chatId, "⏳ Fetching TikTok info...");
      try {
        const res = await callApi(`/download/tiktok?url=${encodeURIComponent(arg)}`);
        const data = await res.json() as Record<string, unknown>;
        const videoUrl = (data["video"] ?? data["url"] ?? data["download"]) as string | undefined;
        const title = (data["title"] ?? data["caption"] ?? "") as string;
        if (videoUrl) {
          await sendText(chatId, `🎵 *${title || "TikTok Video"}*\n\n[Download Link](${videoUrl})`);
        } else {
          await sendText(chatId, "❌ Could not fetch TikTok. Make sure the URL is correct.");
        }
      } catch {
        await sendText(chatId, "❌ TikTok download failed.");
      }
      break;
    }

    case "/youtube": {
      if (!arg) { await sendText(chatId, "Usage: /youtube <search query>"); return; }
      await sendText(chatId, "⏳ Searching YouTube...");
      try {
        const res = await callApi(`/search/youtube?q=${encodeURIComponent(arg)}`);
        const data = await res.json() as Record<string, unknown>;
        const results = (data["results"] ?? data["data"] ?? data["videos"] ?? []) as Array<Record<string, unknown>>;
        if (Array.isArray(results) && results.length > 0) {
          const lines = results.slice(0, 5).map((r, i) => {
            const title = String(r["title"] ?? r["name"] ?? "Video");
            const url = String(r["url"] ?? r["link"] ?? r["videoId"] ?? "");
            return `${i + 1}. [${title}](${url.startsWith("http") ? url : `https://youtube.com/watch?v=${url}`})`;
          });
          await sendText(chatId, `🎬 *YouTube Results for "${arg}"*\n\n${lines.join("\n")}`);
        } else {
          await sendText(chatId, `No results found for "${arg}".`);
        }
      } catch {
        await sendText(chatId, "❌ YouTube search failed.");
      }
      break;
    }

    case "/anime": {
      if (!arg) { await sendText(chatId, "Usage: /anime <title>"); return; }
      await sendText(chatId, "⏳ Searching anime...");
      try {
        const res = await callApi(`/anime/search?q=${encodeURIComponent(arg)}`);
        const data = await res.json() as Record<string, unknown>;
        const results = (data["results"] ?? data["data"] ?? data["anime"] ?? data) as Array<Record<string, unknown>>;
        if (Array.isArray(results) && results.length > 0) {
          const r = results[0] as Record<string, unknown>;
          const title = String(r["title"] ?? r["name"] ?? arg);
          const desc = String(r["synopsis"] ?? r["description"] ?? r["desc"] ?? "").slice(0, 300);
          const score = r["score"] ?? r["rating"] ?? "";
          const image = (r["image"] ?? r["cover"] ?? r["thumbnail"]) as string | undefined;
          const msg = `🎌 *${title}*\n${score ? `⭐ ${score}\n` : ""}${desc ? `\n${desc}...` : ""}`;
          if (image && typeof image === "string" && image.startsWith("http")) {
            await sendPhoto(chatId, image, msg.slice(0, 1024));
          } else {
            await sendText(chatId, msg);
          }
        } else {
          await sendText(chatId, `No anime found for "${arg}".`);
        }
      } catch {
        await sendText(chatId, "❌ Anime search failed.");
      }
      break;
    }

    case "/fact": {
      await sendText(chatId, "⏳ Fetching a fact...");
      try {
        const res = await callApi("/random/fact");
        const data = await res.json() as Record<string, unknown>;
        const fact = String(data["fact"] ?? data["text"] ?? data["result"] ?? JSON.stringify(data));
        await sendText(chatId, `💡 *Random Fact*\n\n${fact}`);
      } catch {
        await sendText(chatId, "❌ Could not fetch a fact.");
      }
      break;
    }

    case "/joke": {
      await sendText(chatId, "⏳ Fetching a joke...");
      try {
        const res = await callApi("/random/joke");
        const data = await res.json() as Record<string, unknown>;
        const joke = String(data["joke"] ?? data["text"] ?? data["result"] ?? JSON.stringify(data));
        await sendText(chatId, `😄 *Random Joke*\n\n${joke}`);
      } catch {
        await sendText(chatId, "❌ Could not fetch a joke.");
      }
      break;
    }

    case "/cat": {
      await sendText(chatId, "⏳ Finding a cat...");
      try {
        const res = await callApi("/animal/cat");
        const data = await res.json() as Record<string, unknown>;
        const url = String(data["url"] ?? data["image"] ?? data["link"] ?? "");
        if (url.startsWith("http")) {
          await sendPhoto(chatId, url, "🐱");
        } else {
          await sendText(chatId, "❌ Could not fetch cat image.");
        }
      } catch {
        await sendText(chatId, "❌ Cat fetch failed.");
      }
      break;
    }

    case "/dog": {
      await sendText(chatId, "⏳ Finding a dog...");
      try {
        const res = await callApi("/animal/dog");
        const data = await res.json() as Record<string, unknown>;
        const url = String(data["url"] ?? data["image"] ?? data["link"] ?? "");
        if (url.startsWith("http")) {
          await sendPhoto(chatId, url, "🐶");
        } else {
          await sendText(chatId, "❌ Could not fetch dog image.");
        }
      } catch {
        await sendText(chatId, "❌ Dog fetch failed.");
      }
      break;
    }

    default: {
      if (cmd.startsWith("/")) {
        await sendText(chatId, `Unknown command: ${cmd}\nSend /help to see available commands.`);
      }
    }
  }
}

router.post("/telegram/webhook", (req: Request, res: Response): void => {
  res.json({ ok: true });

  if (!TOKEN) return;

  const update = req.body as {
    message?: { chat: { id: number }; text?: string };
  };

  const msg = update?.message;
  if (!msg?.text || !msg?.chat?.id) return;

  handleMessage(msg.chat.id, msg.text).catch(() => null);
});

router.get("/telegram/status", (req: Request, res: Response): void => {
  res.json({
    configured: Boolean(TOKEN),
    webhookUrl: TOKEN ? `Set your webhook to: <your-domain>/api/telegram/webhook` : null,
  });
});

export default router;
