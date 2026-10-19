import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const brainDir = path.resolve(__dirname, '../brain');
const designSystemDir = path.resolve(__dirname, '../design-system');

function getAllMarkdownFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.name === '.obsidian' || entry.name === 'node_modules' || entry.name === '.git') {
      continue;
    }
    if (entry.isDirectory()) {
      getAllMarkdownFiles(fullPath, fileList);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const allBrainFiles = getAllMarkdownFiles(brainDir);
const allDesignFiles = getAllMarkdownFiles(designSystemDir);
const allFiles = Array.from(new Set([...allBrainFiles, ...allDesignFiles]));
const fileBasenames = new Map(); // basename -> relativePathFromBrain
const fileRelativeMap = new Set();

allFiles.forEach(f => {
  const rel = path.relative(brainDir, f).replace(/\\/g, '/');
  const base = path.basename(f, '.md');
  fileRelativeMap.add(rel);
  fileBasenames.set(base, rel);
});

console.log(`\n🧠 Total Brain Nodes Found: ${allFiles.length}`);

const graph = {}; // node -> Set of outgoing targets
const inDegree = {}; // node -> count of incoming links
const outDegree = {}; // node -> count of outgoing links

fileRelativeMap.forEach(f => {
  graph[f] = new Set();
  inDegree[f] = 0;
  outDegree[f] = 0;
});

// Regex for [[wikilinks]] and [text](relative_path)
const wikiLinkRegex = /\[\[([a-zA-Z0-9_\-\.\/ &,]+?)(\|.*?)?\]\]/g;
const mdLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

allFiles.forEach(filePath => {
  const relSource = path.relative(brainDir, filePath).replace(/\\/g, '/');
  const content = fs.readFileSync(filePath, 'utf-8');

  // Find wikilinks
  let match;
  while ((match = wikiLinkRegex.exec(content)) !== null) {
    let rawTarget = match[1].trim();
    if (rawTarget.endsWith('.md')) rawTarget = rawTarget.slice(0, -3);

    // Try direct relative match first
    const directRel = rawTarget + '.md';
    if (fileRelativeMap.has(directRel) && directRel !== relSource) {
      graph[relSource].add(directRel);
      continue;
    }

    // Try relative from source dir
    const sourceDir = path.dirname(filePath);
    const absTarget = path.resolve(sourceDir, rawTarget + '.md');
    const relFromBrain = path.relative(brainDir, absTarget).replace(/\\/g, '/');
    if (fileRelativeMap.has(relFromBrain) && relFromBrain !== relSource) {
      graph[relSource].add(relFromBrain);
      continue;
    }

    // Fallback to basename
    const targetBase = path.basename(rawTarget);
    if (fileBasenames.has(targetBase)) {
      const resolvedRel = fileBasenames.get(targetBase);
      if (resolvedRel !== relSource) {
        graph[relSource].add(resolvedRel);
      }
    }
  }

  // Find markdown links
  while ((match = mdLinkRegex.exec(content)) !== null) {
    let href = match[2].trim();
    if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#')) continue;
    // Strip query or anchor
    href = href.split('#')[0];
    if (!href) continue;

    // Handle file:/// if any remains
    if (href.startsWith('file:///')) {
      href = decodeURIComponent(href.replace(/^file:\/\/\//, ''));
      href = path.relative(brainDir, href).replace(/\\/g, '/');
    } else {
      // Resolve relative path from source file's directory
      const sourceDir = path.dirname(filePath);
      const absTarget = path.resolve(sourceDir, href);
      href = path.relative(brainDir, absTarget).replace(/\\/g, '/');
    }

    if (href.endsWith('.md')) {
      if (fileRelativeMap.has(href) && href !== relSource) {
        graph[relSource].add(href);
      } else {
        const base = path.basename(href, '.md');
        if (fileBasenames.has(base)) {
          const resolvedRel = fileBasenames.get(base);
          if (resolvedRel !== relSource) {
            graph[relSource].add(resolvedRel);
          }
        }
      }
    }
  }
});

// Calculate degrees
Object.keys(graph).forEach(source => {
  outDegree[source] = graph[source].size;
  graph[source].forEach(target => {
    if (inDegree[target] !== undefined) {
      inDegree[target]++;
    }
  });
});

console.log('\n📊 Neural Connection Status:');
let orphaned = [];
Object.keys(graph).sort().forEach(node => {
  const inD = inDegree[node];
  const outD = outDegree[node];
  const status = (inD > 0 && outD > 0) ? '✅ CONNECTED' : '❌ ORPHANED';
  console.log(`- [${status}] ${node} (In: ${inD}, Out: ${outD})`);
  if (inD === 0 || outD === 0) {
    orphaned.push({ node, inD, outD });
  }
});

if (orphaned.length === 0) {
  console.log(`\n🎉 PERFECT NEURAL NETWORK: All ${Object.keys(graph).length} nodes are interconnected with 0 orphans!`);
} else {
  console.log(`\n⚠️  WARNING: ${orphaned.length} orphaned/unbalanced nodes detected.`);
}
