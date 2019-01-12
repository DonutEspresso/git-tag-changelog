'use strict';

const assert = require('assert-plus');

const git = require('./git');
const log = require('./log');
const markdown = require('./markdown');

/**
 * command delegation.
 * @param {Object} cliArgs cli arguments object
 * @return {undefined}
 */
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

/**
 * loops through all existing git tags looking for tags that look like semver:
 *    vX.Y.Z
 * it then sorts these by semver order, and loops through them incrementally,
 * comparing delta commits between two iterative versions, generating changelogs
 * until all tags have been iterated through.
 *
 * the changelog is in markdown format, and gets added into the annotation field
 * of the git tag.
 * @param {Object} cliArgs cli arguments object
 * @return {undefined}
 */
function nuclear(cliArgs) {
    if (cliArgs.yesReally !== true) {
        log.error('DANGER: This will permanently destroy all existing');
        log.error('git tags, along with the changelogs in their annotations, ');
        log.error('replacing them with newly created git tags and changelog');
        log.error('annotations. Are you sure if you want to do this?');
        log.fatal('If yes, set the `--yesReally` option.');
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

/**
 * given two semver versions, find the commits (via git tags) and build a
 * changelog that representing the delta commits between those two versions.
 * this always re-calculates the output by traversing the git tree.
 *
 * it then formats this into markdown and outputs to stdout.
 * @param {Object} cliArgs cli arguments object
 * @return {undefined}
 */
function delta(cliArgs) {
    // no assertions required here on input, getDeltaCommits will handle it.
    const { commits, rawCommits } = git.getDeltaCommits(cliArgs.v1, cliArgs.v2);

    if (commits.length === 0) {
        log.exit('No delta commits found.');
    }

    log.debug('final output:');
    console.log(
        cliArgs.raw === true ? rawCommits : markdown.groupedCommits(commits)
    );
}

/**
 * given a new version to release, it searches all existing tags looking for
 * semver versions tags. it assumes the highest found version was the "last"
 * released version, and finds any commits on HEAD not on that last version.
 *
 * it then creates a changelog, and creates a new git tag on HEAD with the
 * specified version and changelog.
 * @param {Object} cliArgs cli arguments object
 * @return {undefined}
 */
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

/**
 * loops through all existing git tags looking for tags that look like semver:
 *    vX.Y.Z
 * it then sorts these by semver order (highest version last), and outputs them
 * to stdout.
 * @param {Object} cliArgs cli arguments object
 * @return {undefined}
 */
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