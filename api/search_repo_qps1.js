import path from "path";
import { searchInRepo } from "../lib/searchInRepo.js";

export default async function handler(req, res) {
  const params = req.method === "POST" ? { ...req.body, ...req.query } : req.query;
  const { query, top_k = 5 } = params;
  const path_glob = ["*.qmd"]; // root-only

  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "query (string) is required" });
  }

  try {
    const results = await searchInRepo({
      repoPath: path.join(process.cwd(), "public", "qps1"),
      query,
      top_k: Number(top_k),
      path_glob,
    });
    res.status(200).json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

