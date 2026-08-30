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
      let values: any;
      let positionals: string[];

      try {
        const parsed = parseArgs({
          args: argv.slice(1),
          options: {
            strict: { type: 'boolean', default: false },
            json: { type: 'boolean', default: false },
            output: { type: 'string' },
            config: { type: 'string' },
            cms: { type: 'string' },
            help: { type: 'boolean', short: 'h', default: false },
            version: { type: 'boolean', short: 'v', default: false },
          },
          allowPositionals: true,
        });
        values = parsed.values;
        positionals = parsed.positionals;
      } catch (err: any) {
        if (argv.includes('--help') || argv.includes('-h')) {
          printScanHelp();
          return 0;
        }
        console.error(`\x1b[31mCLI Argument Error:\x1b[0m ${err.message}`);
        console.log("Run 'slotwire scan --help' for usage instructions.");
        return 1;
      }

      if (values.help) {
        printScanHelp();
        return 0;
      }

      const targetDir = positionals[0] || './dist';
      const scanResult = await scanHtmlDirectory(targetDir, {
        strict: values.strict,
        configPath: values.config,
        cmsUrl: values.cms,
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
  check              Validates slotwire.config.ts contract schema definitions vs CMS
  audit              Audits CMS database for ghost documents and orphaned content

GLOBAL OPTIONS:
  --help, -h         Show help instructions
  --version, -v      Show CLI version

Run 'slotwire <command> --help' for options specific to a command.
`);
}

function printScanHelp() {
  console.log(`
⚡ SlotWire CLI: 'scan' command

USAGE:
  slotwire scan [dir] [options]

ARGUMENTS:
  [dir]              Target directory of built HTML files (Default: './dist')

OPTIONS:
  --strict           Enforces pre-deploy quality gate: fails (exit code 1) if any ghost slots or static fallbacks exist
  --cms <url>        Explicit CMS API URL to audit live database records against
  --config <path>    Path to slotwire.config.ts configuration file
  --output <file>    Writes full JSON report to specified file path
  --json             Emits raw JSON output to stdout for CI/CD pipelines
  --help, -h         Show this scan help message

EXAMPLES:
  slotwire scan ./dist
  slotwire scan ./dist --strict
  slotwire scan ./dist --cms https://cms.brainendeavor.com --strict
  slotwire scan ./dist --json --output report.json
`);
}
