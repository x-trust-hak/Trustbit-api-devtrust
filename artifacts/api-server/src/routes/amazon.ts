// artifacts/api-server/src/routes/amazon.ts
import { Router, type Request, type Response } from "express";
import axios from "axios";
import * as cheerio from "cheerio";

// ─── Core scraping logic (same as we tested in Lemur) ──
async function searchAmazon(query: string, limit: number = 10) {
    // No CORS issues on the server – direct request
    const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(query)}`;
    const response = await axios.get(searchUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        },
        timeout: 15000,
    });
    const html = response.data;
    const $ = cheerio.load(html);

    const products = [];
    $('[data-component-type="s-search-result"]').each((_, el) => {
        if (products.length >= limit) return;
        const asin = $(el).attr('data-asin');
        const title = $(el).find('h2 a span').text().trim() ||
                      $(el).find('h2 a').text().trim() ||
                      $(el).find('.a-size-medium.a-color-base.a-text-normal').text().trim() ||
                      $(el).find('.a-size-base-plus.a-color-base.a-text-normal').text().trim() ||
                      null;
        const priceWhole = $(el).find('.a-price-whole').text().trim();
        const priceFraction = $(el).find('.a-price-fraction').text().trim();
        let price = null;
        if (priceWhole) {
            price = priceWhole + '.' + (priceFraction || '00');
        }
        const image = $(el).find('img.s-image').attr('src') || null;
        const rating = $(el).find('.a-icon-alt').text().trim() || null;
        const reviews = $(el).find('.a-size-base.s-underline-text').text().trim() || null;

        if (asin && title) {
            products.push({
                asin,
                title,
                price,
                image,
                rating,
                reviews,
                url: `https://www.amazon.com/dp/${asin}`,
            });
        }
    });
    return products;
}

// ─── Express Router ──────────────────────────────────────
const amazonRouter = Router();

amazonRouter.get('/search', async (req: Request, res: Response) => {
    const query = req.query.q as string;
    if (!query) {
        return res.status(400).json({ error: 'Missing query parameter: q' });
    }
    const limit = parseInt(req.query.limit as string) || 10;

    try {
        const results = await searchAmazon(query, limit);
        res.json(results);
    } catch (error: any) {
        console.error('[Amazon] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Optional: product details endpoint
amazonRouter.get('/product/:asin', async (req: Request, res: Response) => {
    // ... similar pattern
});

export default amazonRouter;
