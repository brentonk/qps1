module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    return res.status(204).end();
  }
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const body = req.method === 'POST' ? (req.body || {}) : {};
    const { url } = body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'url (string) is required' });
    }

    const r = await fetch(url);
    if (!r.ok) return res.status(502).json({ error: `fetch failed: ${r.status}` });
    const html = await r.text();

    // Minimal pass-through (robust). For richer parsing, add a DOM parser.
    return res.status(200).json({
      title: null,
      url,
      headings: [],
      anchors: [],
      plain_html: html,
      code_blocks: [],
      figures: [],
      tables: []
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e) });
  }
};

