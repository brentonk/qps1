const fs = require('fs');
const path = require('path');
const fg = require('fast-glob');
const { spawnSync } = require('child_process');

async function searchInRepo({ repoPath, query, top_k, path_glob }) {
  if (!fs.existsSync(repoPath)) {
    throw new Error(`Repo path not found: ${repoPath}`);
  }

  const files = await fg(path_glob, { cwd: repoPath, absolute: true });
  const results = [];
  const commitSha = getCommitSha(process.cwd());

  let rgCmd = null;
  try {
    const { rgPath } = require('@vscode/ripgrep');
    rgCmd = rgPath;
  } catch {}

  files.forEach((file) => {
    let matched = false;

    if (rgCmd) {
      const rg = spawnSync(rgCmd, ['--json', query, file], { encoding: 'utf8' });
      if (!rg.error && rg.stdout) {
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
                  commit_sha: commitSha,
                  snippet: obj.data.lines.text.trim(),
                  score: 1.0,
                  language: detectLanguage(obj.data.path.text),
                  chunk_label: extractChunkLabel(obj.data.lines.text),
                });
              }
            } catch {}
          });
        matched = true;
      }
    }

    if (!matched) {
      const content = fs.readFileSync(file, 'utf8');
      content.split('\n').forEach((line) => {
        if (line.includes(query)) {
          const rel = path.relative(process.cwd(), file).replace(/\\/g, '/');
          results.push({
            path: rel,
            url: `https://github.com/brentonk/qps1/blob/main/${rel}`,
            commit_sha: commitSha,
            snippet: line.trim(),
            score: 1.0,
            language: detectLanguage(file),
            chunk_label: extractChunkLabel(line),
          });
        }
      });
    }
  });

  return results.slice(0, top_k);
}

function getCommitSha(repoPath) {
  const git = spawnSync('git', ['-C', repoPath, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
  return git.stdout ? git.stdout.trim() : '';
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

