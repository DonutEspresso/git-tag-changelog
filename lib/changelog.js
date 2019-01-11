'use strict';

const assert = require('assert-plus');

const git = require('./git');
const log = require('./log');
const markdown = require('./markdown');

function changelog(cliArgs) {
    assert.object(cliArgs, 'cliArgs');
    assert.array(cliArgs._args, 'cliArgs._args');

    const action = cliArgs._args[0];

    switch (action) {
        case 'delta':
            delta(cliArgs);
            break;
        case 'list':
            listReleases(cliArgs);
            break;
        case 'tags':
            tags(cliArgs);
            break;
        case 'release':
            release(cliArgs);
            break;
        case undefined:
            log.fatal(`No action specified. Use -h to see possible actions`);
            break;
        default:
            log.fatal(`Unsupported action '${action}'`);
            break;
    }
}

function delta(cliArgs) {
    const { commits, rawCommits } = git.getDeltaCommits(cliArgs.v1, cliArgs.v2);
    console.log(
        cliArgs.raw === true ? rawCommits : markdown.groupedCommits(commits)
    );
}

function release(cliArgs) {
    const { commits } = git.getUnreleasedCommits(cliArgs.last);
    const markdownCommits = markdown.groupedCommits(commits);

    log.info(`Found the following commits since ${cliArgs.last}:\n`);
    console.log(markdownCommits);

    log.info(`Creating git tag ${cliArgs.new}...`);
    git.createTag(cliArgs.new, markdownCommits);

    log.info(`Success!`);
}

function tags(cliArgs) {
    const gitTags = git.getTags();

    if (gitTags.length === 0) {
        console.log('No tags found');
    }

    gitTags.forEach(function(tag) {
        console.log(tag);
    });
}

function listReleases(cliArgs) {
    const releases = git.getReleases();

    if (releases.length === 0) {
        console.log('No releases found');
    }

    releases.forEach(function(r) {
        console.log(r);
    });
}

module.exports = changelog;
