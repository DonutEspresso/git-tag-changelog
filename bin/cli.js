#!/usr/bin/env node
'use strict';

// external modules
const dashdash = require('dashdash');

// internal files
const commands = require('../lib/commands');
const log = require('../lib/log');

// local globals
const DEFAULT_OPTIONS = {
    dry: false,
    logLevel: 30
};

// Specify the options. Minimally `name` (or `names`) and `type`
// must be given for each.
const cliOptions = [
    {
        // `names` or a single `name`. First element is the `opts.KEY`.
        names: ['help', 'h'],
        // See "Option specs" below for types.
        type: 'bool',
        help: 'Print this help and exit.'
    },
    {
        names: ['dry', 'd'],
        type: 'bool',
        help: 'Dry run. Does not actually execute command.'
    },
    {
        names: ['logLevel', 'l'],
        type: 'number',
        help: 'Logging level, valid values: 10, 20, 30, 40, 50.'
    },
    {
        names: ['v1'],
        type: 'string',
        help: `For 'delta' action. A semver version.`
    },
    {
        names: ['v2'],
        type: 'string',
        help: `For 'delta' action. A semver version.`
    },
    {
        names: ['next'],
        type: 'string',
        help: `For 'release' action. The semver of the release.`
    },
    {
        names: ['raw'],
        type: 'bool',
        help: 'Display raw results instead.'
    },
    {
        names: ['yesReally'],
        type: 'bool',
        help: `Confirmation flag for the 'nuclear' action.`
    }
];

// create the cli args parser and parse the args
const parser = dashdash.createParser({ options: cliOptions });
// use global defaults as fallback
const cliArgs = Object.assign({}, DEFAULT_OPTIONS, parser.parse(process.argv));

// if help flag is set, output and bail early
if (cliArgs.help === true) {
    // go to stderr
    console.log(
        'usage: cl [ACTION] [OPTIONS]\n\n' +
            "action: 'list' | 'delta' | release' | 'nuclear' \n" +
            'options:\n' +
            parser.help() +
            '\nsample usage:\n\n' +
            '    * show all git tags that look like releases (semver):\n' +
            '        cl list\n' +
            '    * compare commits between two tags:\n' +
            '        cl delta --v1=6.0.0 --v2=7.0.0\n' +
            '    * create a changelog, and put it in annotation of a new git tag:\n' +
            '        cl release --next=8.0.0\n' +
            '    * DANGER: loop through all existing tags and recreate changelogs:\n' +
            '        cl nuclear --yesReally=true'
    );
    process.exit();
}

// run the program
log.init(cliArgs.logLevel);
commands(cliArgs);
