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
        case 'nuclear':
            nuclear(cliArgs);
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

function nuclear(cliArgs) {
    if (cliArgs.yesReally !== true) {
        log.fatal('Are you sure? If yes, set the `--yesReally` option.');
    }

    const releases = git.getVersions();
    const numReleases = releases.length;

    if (numReleases === 0) {
        log.exit('No releases found, nothing to do.');
    }

    for (let i = 0; i < numReleases; i++) {
        // this is the last version available, then we are done.
        if (typeof releases[i + 1] === 'undefined') {
            break;
        }

        const { commits } = git.getDeltaCommits(releases[i], releases[i + 1]);
        const markdownCommits = markdown.groupedCommits(commits);

        log.debug(`Annotated git tag contents:\n ${markdownCommits}`);
        git.tag(releases[i + 1], markdownCommits, cliArgs.dry);
    }

    log.info(`Success! Don't forget to push your new tags up: `);
    log.info('`git push --tags --no-verify -f`');
}

function delta(cliArgs) {
    const { commits, rawCommits } = git.getDeltaCommits(cliArgs.v1, cliArgs.v2);

    if (commits.length === 0) {
        log.exit('No delta commits found.');
    }

    log.debug('final output:');
    console.log(
        cliArgs.raw === true ? rawCommits : markdown.groupedCommits(commits)
    );
}

function release(cliArgs) {
    if (!cliArgs.hasOwnProperty('next')) {
        log.fatal('`next` version parameter required!');
    }

    const lastVersion = git.getLastVersion();
    const { commits } = git.getUnreleasedCommits(lastVersion);
    const markdownCommits = markdown.groupedCommits(commits);

    log.debug('final output:');
    log.info(`Found the following commits since ${lastVersion}:\n`);
    console.log(markdownCommits);

    git.tag(cliArgs.next, markdownCommits, cliArgs.dry);
    log.info(`Success! Don't forget to push your new tags up: `);
    log.info('`git push --tags --no-verify -f`');
}

function listReleases(cliArgs) {
    const releases = git.getVersions();

    if (releases.length === 0) {
        log.exit('No releases found, nothing to do.');
    }

    log.debug('final output:');
    releases.forEach(function(r) {
        console.log(r);
    });
}

module.exports = changelog;
