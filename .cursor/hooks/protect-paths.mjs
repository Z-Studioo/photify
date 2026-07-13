#!/usr/bin/env node

import path from 'node:path';

const PROJECT_ROOT = process.cwd();

const allow = () => {
  console.log(JSON.stringify({ permission: 'allow' }));
};

const ask = (message, agentMessage = message) => {
  console.log(
    JSON.stringify({
      permission: 'ask',
      user_message: message,
      agent_message: agentMessage,
    })
  );
};

const readStdin = async () => {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  return input;
};

const normalizePath = candidate => {
  if (!candidate || typeof candidate !== 'string') return null;

  const cleaned = candidate
    .replace(/^['"`]+|['"`]+$/g, '')
    .replace(/^file:\/\//, '')
    .trim();

  if (!cleaned || cleaned.includes('\n')) return null;

  const absolute = path.isAbsolute(cleaned)
    ? path.normalize(cleaned)
    : path.normalize(path.join(PROJECT_ROOT, cleaned));

  if (!absolute.startsWith(PROJECT_ROOT)) return null;
  return path.relative(PROJECT_ROOT, absolute).replaceAll(path.sep, '/');
};

const protectedMatchers = [
  {
    category: 'database/Supabase schema',
    test: file => file === 'server/supabase' || file.startsWith('server/supabase/'),
  },
  {
    category: 'payment or integration code',
    test: file =>
      file === 'app/src/lib/stripe.ts' ||
      /^server\/src\/lib\/(stripe|sendgrid)\.ts$/.test(file) ||
      /^server\/src\/controllers\/(webhookController|checkoutController|paymentIntentController)\.ts$/.test(file) ||
      /^server\/src\/routes\/(webhook|checkout|payment-intent)\.ts$/.test(file),
  },
  {
    category: 'backend/API code',
    test: file => file === 'server' || file.startsWith('server/'),
  },
  {
    category: 'environment or secrets config',
    test: file => /(^|\/)\.env($|\.)/.test(file) || file.endsWith('/.env') || file.includes('/.env.'),
  },
  {
    category: 'project configuration or infrastructure',
    test: file =>
      file === 'render.yaml' ||
      file === 'commitlint.config.js' ||
      file.startsWith('.github/') ||
      /(^|\/)tsconfig[^/]*\.json$/.test(file) ||
      /(^|\/)vite\.config\.(ts|js)$/.test(file),
  },
  {
    category: 'dependencies/lockfiles',
    test: file =>
      file === 'package.json' ||
      file === 'package-lock.json' ||
      file === 'app/package.json' ||
      file === 'app/package-lock.json' ||
      file === 'server/package.json' ||
      file === 'server/package-lock.json',
  },
  {
    category: 'Cursor/git guardrails',
    test: file =>
      file === '.cursor/hooks.json' ||
      file.startsWith('.cursor/hooks/') ||
      file.startsWith('.husky/'),
  },
];

const freeToEdit = file =>
  file === 'docs' ||
  file.startsWith('docs/') ||
  file.endsWith('.md') ||
  file.startsWith('app/src/');

const classifyPath = file => {
  if (!file) return null;
  const protectedMatch = protectedMatchers.find(({ test }) => test(file));
  if (protectedMatch) return protectedMatch.category;
  if (freeToEdit(file)) return null;
  return 'non-frontend project file';
};

const collectStrings = value => {
  const strings = [];

  const visit = item => {
    if (typeof item === 'string') {
      strings.push(item);
      return;
    }
    if (!item || typeof item !== 'object') return;
    if (Array.isArray(item)) {
      item.forEach(visit);
      return;
    }
    Object.values(item).forEach(visit);
  };

  visit(value);
  return strings;
};

const extractPatchPaths = text => {
  const matches = [];
  const pattern = /^\*\*\* (?:Add|Update|Delete) File: (.+)$/gm;
  let match;
  while ((match = pattern.exec(text)) !== null) matches.push(match[1]);
  return matches;
};

const pathCandidatesFromInput = input => {
  const candidates = new Set();

  for (const value of collectStrings(input)) {
    extractPatchPaths(value).forEach(file => candidates.add(file));

    const trimmed = value.trim();
    if (
      /^(\.?\.?\/|\/|app\/|server\/|docs\/|\.cursor\/|\.github\/|\.husky\/)/.test(trimmed) ||
      /^[\w.-]+\.(ts|tsx|js|jsx|json|sql|yml|yaml|md|env)$/.test(trimmed)
    ) {
      candidates.add(trimmed);
    }
  }

  return [...candidates].map(normalizePath).filter(Boolean);
};

const getShellCommand = input =>
  input?.command ||
  input?.tool_input?.command ||
  input?.input?.command ||
  input?.arguments?.command ||
  '';

const commandTouchesProtectedPath = command =>
  [
    'server/',
    'server ',
    'server/supabase',
    '.github/',
    '.husky/',
    '.cursor/hooks',
    '.cursor/hooks.json',
    'render.yaml',
    'package.json',
    'package-lock.json',
    '.env',
  ].some(snippet => command.includes(snippet));

const classifyShellCommand = command => {
  const trimmed = command.trim();
  if (!trimmed) return null;

  const riskyCommands = [
    {
      category: 'destructive git operation',
      test: /\bgit\s+(reset\s+--hard|checkout\s+--|clean\s+-|push\b.*--force)/,
    },
    {
      category: 'dependency change',
      test:
        /\b(npm\s+(install|i|uninstall|remove|update)|pnpm\s+(add|remove|install|update)|yarn\s+(add|remove|install|upgrade)|bun\s+(add|remove|install|update))\b/,
    },
    {
      category: 'database operation',
      test: /\bsupabase\s+db\s+(push|reset|diff|repair)\b|\bpsql\b.*\b(DROP|ALTER|TRUNCATE)\b/i,
    },
    {
      category: 'in-place file rewrite',
      test: /\b(sed\s+-i|perl\s+-pi)\b/,
    },
    {
      category: 'destructive file operation',
      test: /\brm\s+(-[^\s]*r[^\s]*f|-rf|-fr)\b/,
    },
  ];

  const riskyMatch = riskyCommands.find(({ test }) => test.test(trimmed));
  if (riskyMatch) return riskyMatch.category;

  const writesFiles =
    /\b(mv|cp|rm|touch|mkdir|tee|chmod|chown)\b/.test(trimmed) ||
    /(^|[^<])>\s*["']?[^"'\s]+/.test(trimmed);

  if (writesFiles && commandTouchesProtectedPath(trimmed)) return 'write to protected path';
  return null;
};

const main = async () => {
  const raw = await readStdin();
  let input;

  try {
    input = raw ? JSON.parse(raw) : {};
  } catch {
    ask('Cursor guard could not parse hook input. Review this action before continuing.');
    return;
  }

  const shellCommand = getShellCommand(input);
  if (shellCommand) {
    const shellCategory = classifyShellCommand(shellCommand);
    if (shellCategory) {
      ask(
        `This shell command looks like a ${shellCategory}. Please confirm it is intentional before running it.`,
        `A project guard flagged this shell command as ${shellCategory}: ${shellCommand}`
      );
      return;
    }
  }

  const paths = [...new Set(pathCandidatesFromInput(input))];
  const protectedPath = paths
    .map(file => ({ file, category: classifyPath(file) }))
    .find(({ category }) => category);

  if (protectedPath) {
    ask(
      `Cursor is trying to change ${protectedPath.file} (${protectedPath.category}). Please confirm this protected-file edit is intentional.`,
      `A project guard flagged ${protectedPath.file} as ${protectedPath.category}. Ask the user before editing protected areas.`
    );
    return;
  }

  allow();
};

main().catch(error => {
  ask(`Cursor guard failed: ${error.message}. Review this action before continuing.`);
});
