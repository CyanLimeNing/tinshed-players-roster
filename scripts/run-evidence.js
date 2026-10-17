'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const label = process.argv[2] || 'verification';
if (!/^[a-z0-9-]+$/.test(label)) throw new Error('Use a simple evidence label.');
const directory = process.env.A3_EVIDENCE_DIR
  ? path.resolve(process.env.A3_EVIDENCE_DIR, label)
  : path.join(root, 'docs/a3/evidence', label);
if (fs.existsSync(directory)) throw new Error('Evidence label already exists. Use a new label to preserve prior results.');
fs.mkdirSync(directory, { recursive: true });
const testFiles = fs.readdirSync(path.join(root, 'test')).filter(f => f.endsWith('.test.js')).sort().map(f => `test/${f}`);
const started = new Date().toISOString();
const result = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...testFiles], { cwd: root, encoding: 'utf8' });
if (result.error) throw result.error;
fs.writeFileSync(path.join(directory, 'test-results.tap'), result.stdout);
fs.writeFileSync(path.join(directory, 'stderr.txt'), result.stderr);
const fileHashes = {};
for (const dir of ['src', 'public', 'test', 'scripts']) {
  for (const file of fs.readdirSync(path.join(root, dir), { recursive: true })) {
    const rel = `${dir}/${file.replaceAll('\\', '/')}`;
    if (fs.statSync(path.join(root, rel)).isFile()) fileHashes[rel] = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, rel))).digest('hex');
  }
}
for (const file of ['package.json', 'package-lock.json']) fileHashes[file] = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
const totals = {};
for (const match of result.stdout.matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)$/gm)) totals[match[1]] = Number(match[2]);
const gitRead = args => {
  const value = spawnSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true });
  return value.status === 0 ? value.stdout.trim() : null;
};
const metadata = { label, startedAtUtc: started, finishedAtUtc: new Date().toISOString(), executor: 'AI-assisted automated execution', version: JSON.parse(fs.readFileSync(path.join(root, 'package.json'))).version, sourceCommit: gitRead(['rev-parse', 'HEAD']), workingTreeState: gitRead(['status', '--porcelain']), node: process.version, platform: process.platform, architecture: process.arch, command: `node --test --test-reporter=tap ${testFiles.join(' ')}`, upstreamBaseline: 'f2999cfdd1d213ce8548ac142c35944decf85d9b', exitCode: result.status, totals, fileHashes };
fs.writeFileSync(path.join(directory, 'run-metadata.json'), JSON.stringify(metadata, null, 2) + '\n');
console.log(JSON.stringify({ label, exitCode: result.status, totals, directory }, null, 2));
process.exitCode = result.status ?? 1;
