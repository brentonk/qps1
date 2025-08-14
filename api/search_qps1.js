const { searchIndex } = require('../lib/searchIndex');

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
    const { query, top_k = 5, filters = null } = body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'query (string) is required' });
    }

    const results = await searchIndex(query, top_k, filters);
    return res.status(200).json({ results });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e) });
  }
};

