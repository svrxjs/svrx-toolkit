#!/usr/bin/env node

const program = require('commander');
const Scaffold = require('../lib/scaffold');
const Server = require('../lib/server');

program.version(require('../package').version).usage('<command> [options]');

program
  .command('init')
  .description('Generate a svrx plugin project')
  .action(async () => {
    new Scaffold();
  });

program
  .command('serve')
  .description('Start a svrx server to debug plugin')
  .action(async () => {
    new Server();
  });

program
  .command('help')
  .description('List commands and options for svrx-toolkit')
  .action(async () => {
    console.log('Usage: svrx-toolkit <command> [options]\n');
    console.log('Commands and options:\n');
    console.log('init    Generate a svrx plugin project');
    console.log('serve   Start a svrx server to debug plugin');
  });

program.parse(process.argv);

if (!program.args.length) {
  program.help();
}
