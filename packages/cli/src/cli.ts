import { parseArgs } from 'node:util';
import * as fs from 'node:fs/promises';
import { scanHtmlDirectory } from './scanner.js';
import { formatConsoleReport, exportJsonReport } from './report.js';

export async function runCli(argv: string[] = process.argv.slice(2)): Promise<number> {
  const command = argv[0];

  if (!command || command === '--help' || command === '-h' || command === 'help') {
    printHelp();
    return 0;
  }

  if (command === '--version' || command === '-v') {
    console.log('slotwire-cli v0.1.0');
    return 0;
  }

  switch (command) {
    case 'scan': {
      const { values, positionals } = parseArgs({
        args: argv.slice(1),
        options: {
          strict: { type: 'boolean', default: false },
          json: { type: 'boolean', default: false },
          output: { type: 'string' },
          config: { type: 'string' },
        },
        allowPositionals: true,
      });

      const targetDir = positionals[0] || './dist';
      const scanResult = await scanHtmlDirectory(targetDir, {
        strict: values.strict,
        configPath: values.config,
      });

      if (values.output) {
        await fs.writeFile(values.output, exportJsonReport(scanResult), 'utf-8');
      }

      if (values.json) {
        console.log(exportJsonReport(scanResult));
      } else {
        console.log(formatConsoleReport(scanResult, { strict: values.strict }));
      }

      if (values.strict && !scanResult.isClean) {
        return 1;
      }
      return 0;
    }

    case 'check':
    case 'audit': {
      console.log('⚡ SlotWire Contract & Completeness Checker');
      console.log('To scan your built site output, run: slotwire scan ./dist --strict');
      return 0;
    }

    default:
      console.error(`Unknown command '${command}'. Run 'slotwire --help' for available commands.`);
      return 1;
  }
}

function printHelp() {
  console.log(`
⚡ SlotWire CLI: Automated AST & HTML Scanner & Contract Validator

USAGE:
  slotwire <command> [options]

COMMANDS:
  scan [dir]         Crawls built HTML files (default: ./dist) and generates a Slot Completeness Matrix
  check              Validates slotwire.config.ts contract schema definitions
  audit              Audits CMS database for ghost documents and orphaned content

OPTIONS:
  --strict           Fails with exit code 1 if unpopulated required slots or ghost slots exist
  --json             Outputs audit results as JSON
  --output <file>    Writes JSON audit report to a file
  --config <path>    Path to custom slotwire.config.ts
  --help, -h         Show help
  --version, -v      Show version
`);
}
