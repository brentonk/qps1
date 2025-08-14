const fs = require('fs');
const path = require('path');
const fg = require('fast-glob');
const { spawnSync } = require('child_process');
const { rgPath } = require('@vscode/ripgrep');

async function searchInRepo({ repoPath, query, top_k, path_glob }) {
  if (!fs.existsSync(repoPath)) {
    throw new Error(`Repo path not found: ${repoPath}`);
  }

  const files = await fg(path_glob, { cwd: repoPath, absolute: true });
  const results = [];

  const rgCmd = rgPath || 'rg';

  files.forEach((file) => {
    const rg = spawnSync(rgCmd, ['--json', query, file], { encoding: 'utf8' });
    if (rg.stdout) {
      rg.stdout
        .split('\n')
        .filter(Boolean)
        .forEach((line) => {
          try {
            const obj = JSON.parse(line);
            if (obj.type === 'match') {
              const rel = path.relative(process.cwd(), obj.data.path.text).replace(/\\/g, '/');
              results.push({
                path: rel,
                url: `https://github.com/brentonk/qps1/blob/main/${rel}`,
                commit_sha: getCommitSha(process.cwd()),
                snippet: obj.data.lines.text.trim(),
                score: 1.0,
                language: detectLanguage(obj.data.path.text),
                chunk_label: extractChunkLabel(obj.data.lines.text),
              });
            }
          } catch {}
        });
    }
  });

  return results.slice(0, top_k);
}

function getCommitSha(repoPath) {
  const git = spawnSync('git', ['-C', repoPath, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
  return git.stdout.trim();
}

function detectLanguage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.qmd' || ext === '.md') return 'markdown';
  if (ext === '.r' || ext === '.rmd') return 'r';
  return '';
}

function extractChunkLabel(line) {
  const match = line.match(/\{#(.*?)\}/);
  return match ? match[1] : null;
}

module.exports = { searchInRepo };

