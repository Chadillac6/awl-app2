#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

const GOG = process.env.GOG_BIN ?? '/opt/homebrew/bin/gog';
const scriptId = process.env.AWL_APPS_SCRIPT_ID || process.argv.find((arg) => arg.startsWith('--script-id='))?.split('=')[1];
const endpoint = process.env.AWL_PUSH_ENDPOINT || process.argv.find((arg) => arg.startsWith('--endpoint='))?.split('=')[1];
const adminKey = process.env.AWL_PUSH_ADMIN_API_KEY || process.env.ADMIN_API_KEY || process.argv.find((arg) => arg.startsWith('--admin-key='))?.split('=')[1];

if (!scriptId) throw new Error('Missing --script-id or AWL_APPS_SCRIPT_ID');
if (!endpoint) throw new Error('Missing --endpoint or AWL_PUSH_ENDPOINT');
if (!adminKey) throw new Error('Missing --admin-key or AWL_PUSH_ADMIN_API_KEY');

const output = execFileSync(GOG, [
  'appscript', 'run', scriptId, 'setAwlPushConfig',
  '--params', JSON.stringify([endpoint, adminKey]),
  '--dev-mode',
  '--json',
  '--no-input',
], { encoding: 'utf8', env: process.env });

console.log(output);
