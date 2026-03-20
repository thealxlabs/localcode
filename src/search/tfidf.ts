// src/search/tfidf.ts
// Simple TF-IDF file relevance scorer

import * as fs from 'fs';
import * as path from 'path';

export interface MatchLine {
  lineNumber: number;   // 1-based
  text: string;
}

export interface SearchResult {
  filePath: string;
  score: number;
  snippet: string;           // first matching line (legacy compat)
  relevance: 'high' | 'medium' | 'low';
  matchingLines: MatchLine[]; // lines containing query tokens, with context
}

export interface SearchIndex {
  files: string[];
  termFreq: Map<string, Map<string, number>>;  // term → file → count
  docFreq: Map<string, number>;                 // term → number of docs containing it
}

// File extensions to index
const TEXT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.rb', '.go', '.rs', '.java', '.c', '.cpp', '.h', '.hpp',
  '.md', '.txt', '.json', '.yaml', '.yml', '.toml', '.ini', '.cfg',
  '.html', '.css', '.scss', '.less', '.sh', '.bash', '.zsh',
  '.sql', '.graphql', '.proto', '.xml', '.env',
]);

// Directories to skip
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'out', '.next',
  '__pycache__', '.cache', 'coverage', '.nyc_output',
  'target', 'vendor', '.venv', 'venv',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9_]+/)
    .filter((t) => t.length > 2 && t.length < 50);
}

/** Extract tokens + adjacent bigrams for phrase boosting. */
function tokenizeWithBigrams(text: string): string[] {
  const tokens = tokenize(text);
  const bigrams: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.push(`${tokens[i]}_${tokens[i + 1]}`);
  }
  return [...tokens, ...bigrams];
}

function relevanceBand(score: number): 'high' | 'medium' | 'low' {
  if (score >= 0.3) return 'high';
  if (score >= 0.1) return 'medium';
  return 'low';
}

function extractMatchingLines(
  filePath: string,
  queryTokens: string[],
  contextLines = 2,
): MatchLine[] {
  let lines: string[];
  try {
    lines = fs.readFileSync(filePath, 'utf8').split('\n');
  } catch {
    return [];
  }

  const matchIndices = new Set<number>();
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    if (queryTokens.some((t) => lower.includes(t))) {
      for (let c = Math.max(0, i - contextLines); c <= Math.min(lines.length - 1, i + contextLines); c++) {
        matchIndices.add(c);
      }
    }
  }

  return Array.from(matchIndices)
    .sort((a, b) => a - b)
    .slice(0, 20) // cap at 20 lines to avoid huge output
    .map((i) => ({ lineNumber: i + 1, text: lines[i] }));
}

function walkDir(dir: string, maxFiles: number, files: string[] = []): string[] {
  if (files.length >= maxFiles) return files;

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }

  for (const entry of entries) {
    if (files.length >= maxFiles) break;
    if (entry.name.startsWith('.') && !entry.name.startsWith('.env')) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) {
        walkDir(fullPath, maxFiles, files);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (TEXT_EXTENSIONS.has(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

export function buildIndex(dir: string, maxFiles = 500): SearchIndex {
  const index: SearchIndex = {
    files: [],
    termFreq: new Map(),
    docFreq: new Map(),
  };

  const files = walkDir(dir, maxFiles);
  index.files = files;

  for (const filePath of files) {
    let content: string;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }

    const tokens = tokenizeWithBigrams(content);
    const termCounts = new Map<string, number>();

    for (const token of tokens) {
      termCounts.set(token, (termCounts.get(token) ?? 0) + 1);
    }

    const totalTokens = tokens.length || 1;
    for (const [term, count] of termCounts) {
      // TF: normalized term frequency
      const tf = count / totalTokens;
      if (!index.termFreq.has(term)) {
        index.termFreq.set(term, new Map());
      }
      index.termFreq.get(term)!.set(filePath, tf);
      index.docFreq.set(term, (index.docFreq.get(term) ?? 0) + 1);
    }
  }

  return index;
}

function scoreFiles(queryTokens: string[], index: SearchIndex): Map<string, number> {
  const numDocs = index.files.length;
  const scores = new Map<string, number>();

  for (const term of queryTokens) {
    const tf = index.termFreq.get(term);
    if (!tf) continue;
    const df = index.docFreq.get(term) ?? 1;
    const idf = Math.log((numDocs + 1) / (df + 1)) + 1;
    // Bigrams get a 1.5× boost for phrase matching
    const boost = term.includes('_') ? 1.5 : 1.0;
    for (const [filePath, termFreq] of tf) {
      scores.set(filePath, (scores.get(filePath) ?? 0) + termFreq * idf * boost);
    }
  }

  return scores;
}

export function search(query: string, index: SearchIndex, topK = 5): SearchResult[] {
  if (index.files.length === 0) return [];

  const queryTokens = tokenizeWithBigrams(query);
  const baseTokens  = tokenize(query);
  if (queryTokens.length === 0) return [];

  const scores = scoreFiles(queryTokens, index);
  const ranked = Array.from(scores.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, topK);

  const results: SearchResult[] = [];

  for (const [filePath, score] of ranked) {
    let snippet = '';
    try {
      const lines = fs.readFileSync(filePath, 'utf8').split('\n');
      for (const line of lines) {
        const lower = line.toLowerCase();
        if (baseTokens.some((t) => lower.includes(t))) {
          snippet = line.trim().slice(0, 120);
          break;
        }
      }
      if (!snippet && lines.length > 0) snippet = lines[0].trim().slice(0, 120);
    } catch { /* ok */ }

    results.push({
      filePath,
      score,
      snippet,
      relevance: relevanceBand(score),
      matchingLines: [],
    });
  }

  return results;
}

/**
 * Like search() but also returns surrounding context lines for each match.
 * Use this for interactive /search display.
 */
export function searchWithContext(
  query: string,
  index: SearchIndex,
  topK = 10,
  contextLines = 2,
): SearchResult[] {
  if (index.files.length === 0) return [];

  const queryTokens = tokenizeWithBigrams(query);
  const baseTokens  = tokenize(query);
  if (queryTokens.length === 0) return [];

  const scores = scoreFiles(queryTokens, index);
  const ranked = Array.from(scores.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, topK);

  return ranked.map(([filePath, score]) => {
    let snippet = '';
    const matchingLines = extractMatchingLines(filePath, baseTokens, contextLines);
    if (matchingLines.length > 0) {
      snippet = matchingLines[0].text.trim().slice(0, 120);
    }
    return { filePath, score, snippet, relevance: relevanceBand(score), matchingLines };
  });
}
