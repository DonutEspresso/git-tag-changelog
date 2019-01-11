#!/usr/bin/env node
'use strict';

// external modules
const dashdash = require('dashdash');

// internal files
const changelog = require('../lib/changelog');
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
        help: 'Dry run. Outputs tags/changelogs to stdout. Defaults to false.'
    },
    {
        names: ['prefix', 'p'],
        type: 'string',
        help: 'Prefix attached to semver string by tooling. Usually `v`.'
    },
    {
        names: ['logLevel', 'l'],
        type: 'number',
        help: 'Logging level, valid values: 10, 20, 30, 40, 50.'
    },
    {
        names: ['v1'],
        type: 'string',
        help: `For 'delta' or 'release' action. A semver version.`
    },
    {
        names: ['v2'],
        type: 'string',
        help: `For 'delta' action. A semver version.`
    },
    {
        names: ['last'],
        type: 'string',
        help: `For 'release' action. Last version to generate changelog against`
    },
    {
        names: ['new'],
        type: 'string',
        help: `For 'release' action. New version to tag and create.`
    },
    {
        names: ['raw'],
        type: 'bool',
        help: `Display raw results instead.`
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
            "action: 'tags' | 'list' | 'release' | 'delta'\n" +
            'options:\n' +
            parser.help() +
            '\nsample usage:\n\n' +
            '    compare commits between two tags:\n' +
            '        cl delta 6.0.0 7.0.0'
    );
    process.exit();
}

// run the program
log.init(cliArgs.logLevel);
changelog(cliArgs);
