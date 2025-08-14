const { ensureIndex } = require('../lib/searchIndex');

module.exports = async (_req, res) => {
  try {
    await ensureIndex(true);
    return res.status(200).json({ ok: true, refreshedAt: new Date().toISOString() });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e) });
  }
};

