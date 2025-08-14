const path = require('path');
const { searchInRepo } = require('../lib/searchInRepo');

module.exports = async (req, res) => {
  const params = req.method === 'POST' ? { ...req.body, ...req.query } : req.query;
  const { query, top_k = 5 } = params;
  const path_glob = ['**/*.qmd'];

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'query (string) is required' });
  }

  try {
    const results = await searchInRepo({
      repoPath: path.join(process.cwd(), 'quarto'),
      query,
      top_k: Number(top_k),
      path_glob,
    });
    res.status(200).json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

