import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /api/address/lookup?postcode=SW1A1AA
 * Proxies the PostCoder address lookup so the API key never reaches the browser.
 */
router.get('/lookup', async (req: Request, res: Response) => {
  const postcode = (req.query.postcode as string | undefined)?.trim();

  if (!postcode) {
    return res.status(400).json({ error: 'postcode query parameter is required' });
  }

  const apiKey = process.env.POSTCODER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Address lookup not configured' });
  }

  try {
    const url = `https://ws.postcoder.com/pcw/${apiKey}/address/uk/${encodeURIComponent(postcode)}?format=json&lines=2&addtags=latitude,longitude`;
    const upstream = await fetch(url);

    if (upstream.status === 401 || upstream.status === 403) {
      return res.status(502).json({ error: 'Address lookup service authentication failed' });
    }

    if (upstream.status === 404 || upstream.status === 400) {
      return res.status(404).json({ error: 'Postcode not found' });
    }

    if (!upstream.ok) {
      return res.status(502).json({ error: 'Address lookup service unavailable' });
    }

    const data = await upstream.json();
    return res.json(data);
  } catch (err) {
    console.error('PostCoder proxy error:', err);
    return res.status(502).json({ error: 'Failed to reach address lookup service' });
  }
});

export default router;
