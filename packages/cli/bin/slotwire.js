#!/usr/bin/env node
import { runCli } from '../dist/cli.js';

runCli(process.argv.slice(2)).then((exitCode) => {
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}).catch((err) => {
  console.error('Fatal SlotWire CLI error:', err);
  process.exit(1);
});
