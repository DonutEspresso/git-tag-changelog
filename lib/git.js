'use strict';

// core modules
const execSync = require('child_process').execSync;

// external modules
const assert = require('assert-plus');
const _ = require('lodash');
const semver = require('semver');

// local globals
const log = require('./log');
const VERSION_PREFIX = 'v';
const CC_REGEX = /^([A-Za-z0-9]+)(?:\s{1})([^\:]*)?(?:\:)?(.*)$/gm;
const CC_FALLBACK_REGEX = /^([A-Za-z0-9]+)(?:\s{1})(.*)/gm;
const CC_DETAIL_REGEX = /(.*(?=\())(\(.*\))/;

const git = {
    /**
     * returns all git tags. may be unsorted.
     * @return {Array}
     */
    getTags() {
        return exec(`git tag -l`)
            .trim()
            .split('\n');
    },

    /**
     * get the latest released version.
     * @return {String}
     */
    getLastVersion() {
        return this.getVersions().pop();
    },

    /**
     * returns all git tags that look like semver (and are thus releases). then
     * sort results by semver order.
     * @return {Array}
     */
    getVersions() {
        // sort tags by semver string
        const tags = _.chain(this.getTags())
            .filter()
            .reduce(function(acc, tag) {
                const parsed = semver.coerce(tag);
                // if semver couldn't be parsed, it will return null
                if (parsed !== null) {
                    acc.push(parsed);
                }
                return acc;
            }, [])
            .sortBy(['major', 'minor', 'patch'])
            .map('raw')
            .value();

        return tags;
    },

    /**
     * return a list of git commits between HEAD and specified version.
     * @param {String} version a semver string
     * @return {Array} an array of commit objects
     */
    getUnreleasedCommits(version) {
        assert.string(version, 'version');

        if (semver.valid(version) === null) {
            log.fatal(`Invalid semver: ${version}`);
        }

        const versions = this.getVersions();

        if (!_.includes(versions, version)) {
            log.fatal(`Version ${version} does not exist!`);
        }

        const rawCommits = exec(
            `git log --pretty=oneline HEAD...${VERSION_PREFIX}${version}`
        )
            .trim()
            .split('\n');

        // commits will be ordered in reverse chronological order, with lowest
        // index being newest. trim empty new lines.
        const commits = _.chain(rawCommits)
            .filter()
            .map(this.parseConventionalCommit)
            .value();
        log.debug({ commits }, 'parsed commits');

        return {
            commits,
            rawCommits
        };
    },

    /**
     * return a list of git commits between two tags. the first tag should
     * always be the newer tag.
     * @param {String} v1 a semver string
     * @param {String} v2 a semver string
     * @return {Array} an array of commit objects
     */
    getDeltaCommits(v1, v2) {
        assert.string(v1, 'v1');
        assert.string(v2, 'v2');

        if (semver.valid(v2) === null || semver.valid(v1) === null) {
            log.fatal(`Invalid semver: ${v2}, ${v1}`);
        }

        const versions = this.getVersions();

        if (!_.includes(versions, v1)) {
            log.fail(`Invalid semver: ${v2}, ${v1}`);
        }

        if (!_.includes(versions, v1)) {
            log.fail(`Version ${v1} does not exist!`);
        }

        if (!_.includes(versions, v2)) {
            log.fail(`Version ${v2} does not exist!`);
        }

        // expected commit message would look like this:
        // ba14b5e Upgrade: commit new deps
        // Expected template is:
        // {gitsha} {commitType}: {commitMsg}
        //
        // examples:
        // 1f08fb37e1534c52dcb77704d86c403b8b2cf854 upgrade: restify@7.4.0 (#519)
        // c89584a10068bba3b7f3f9b70d615a0d6b1ec20d upgrade: edgar-client-3.2.1',
        // 6ea56d5f7bb634fbd626e258388b4dd9fcac906d feat: support USE_YARN docker build flag (#514)
        // b4e2202ec90995c51e5dac6c2f9f8f16675db5f0 chore(github): add contribution guidelines (#515)
        // e9e33881a1ad7d7f389cf9bf3bc013a602b19091 feat: add option to disable built-in request parsers (#509)
        // 07c4723a3392fd0f8614c2b393669118b63088bc fix: run npm scripts in app dir if present (#513)
        // 5f44579630e24505c28630a3abc497297ddd821a fix: set NQ_APP_DIR at run time outside of development workflow (#512)
        // bb819bd84599e642a5af6ac1013bd56eb8761e4a feat: add support for restify\'s strictFormatters flag (#507)

        // commits will be ordered in reverse chronological order, with lowest
        // index being newest. trim empty new lines.
        const rawCommits = exec(
            `git log --pretty=oneline ${VERSION_PREFIX}${v2}...${VERSION_PREFIX}${v1}`
        )
            .trim()
            .split('\n');

        const commits = _.chain(rawCommits)
            .filter()
            .map(this.parseConventionalCommit)
            .value();
        log.debug({ commits }, 'parsed commits');

        return {
            commits,
            rawCommits
        };
    },

    /**
     * create a git tag with the specified name and annotation value.
     * @param {String} name tag name
     * @param {String} annotation tag annotation summary
     * @param {Boolean} dryRun if true, don't do anything
     * @return {undefined}
     */
    tag(name, annotation, dryRun) {
        assert.string(name, 'name');
        assert.string(annotation, 'annotation');

        // if the git tree is dirty, fail.
        if (this.isDirty()) {
            log.fatal(
                'Working git tree cannot be dirty when creating new tags, aborting!'
            );
        }

        // check if tag exists. if so, edit instead of stomping over it.
        let cmd;
        const tags = this.getTags();
        const realTagName = VERSION_PREFIX + name;

        // prepare the annotation. escape any " in the message with \", since
        // git expects it to be escaped.
        const escAnnotation = annotation.replace(/"/g, '\\"');

        if (_.includes(tags, realTagName)) {
            // if the tag exists, checkout the commit before we do any tagging
            // so we don't mistag things.
            this.checkoutTag(realTagName);

            // get the original date of the commit that this tag is associated
            // with. editing/updating any tag changes the dat, so we have to
            // use it here.
            const originalDate = this.getCommitDate(realTagName);

            cmd =
                `GIT_COMMITTER_DATE="${originalDate}" git tag ${realTagName} ${realTagName}^{} --cleanup=whitespace -f -m "Release\n` +
                escAnnotation +
                '"';
        } else {
            // if this is a new tag, assume we are tagging on HEAD.
            this.checkoutTag('HEAD');

            cmd =
                `git tag ${realTagName} ${realTagName}^{} --cleanup=whitespace -f -m "Release\n` +
                escAnnotation +
                '"';
        }

        if (dryRun === false) {
            log.info(`Creating git tag ${realTagName}...`);
            console.log(exec(cmd));
        } else {
            log.info('[DRY RUN] executing command:\n' + cmd);
        }
    },

    /**
     * parse a conventional commit message, e.g.:
     *   chore(github): this is a commit
     *   upgrade: foo@1.2.3
     * would return
     * {
     *   type: chore,
     *   detail: github,
     *   message: this is a commit
     * }
     * {
     *   type: upgrade,
     *   detail: null,
     *   message: foo@1.2.3
     * }
     * @param {String} msg conventional commit message
     * @return {Object}
     */
    parseConventionalCommit(msg) {
        assert.string(msg, 'msg');

        let m;
        const results = [];

        // parse this line:
        // '1f08fb37e1534c52dcb77704d86c403b8b2cf854 upgrade: restify@7.4.0 (#519)'
        // into a POJO
        while ((m = CC_REGEX.exec(msg)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === CC_REGEX.lastIndex) {
                CC_REGEX.lastIndex++;
            }

            m.forEach((match, groupIndex) => {
                if (match !== '') {
                    results.push(match.trim());
                }
            });
        }

        // we didn't match 4 character groups, the regex failed. use the
        // fallback regex to match more broadly.
        if (results.length !== 4) {
            // if we couldn't parse, fall back on simple regex
            while ((m = CC_FALLBACK_REGEX.exec(msg)) !== null) {
                // This is necessary to avoid infinite loops with zero-width
                // matches
                if (m.index === CC_FALLBACK_REGEX.lastIndex) {
                    CC_FALLBACK_REGEX.lastIndex++;
                }

                m.forEach((match, groupIndex) => {
                    if (match !== '') {
                        results.push(match.trim());
                    }
                });
            }

            return {
                sha: results[1].trim(),
                message: results[2].trim(),
                type: 'unknown',
                typeDetail: null
            };
        }

        // if we have a commit type, try to match a detail.
        let type = results[2];
        let typeDetail;

        if (type) {
            if ((m = CC_DETAIL_REGEX.exec(type)) !== null) {
                m.forEach((match, idx) => {
                    if (idx === 1) {
                        type = match.trim();
                    } else if (idx === 2) {
                        typeDetail = match.trim();
                    }
                });
            }
        }

        return {
            sha: results[1].trim(),
            type: type ? type.toLowerCase() : 'unknown',
            typeDetail: typeDetail && typeDetail.toLowerCase(),
            message: results[3].trim(),
            raw: msg
        };
    },

    /**
     * return the date of a commit associated with a git tag
     * @param {String} tag a git tag
     * @return {String}
     */
    getCommitDate(tag) {
        assert.string(tag);

        // this returns a date string like:
        // 2017-02-08 14:55:48 -0800
        return exec(`git log -1 --format=%ai ${tag}`).trim();
    },

    /**
     * git checkout a git tag.
     * @param {String} tag a git tag
     * @return {undefined}
     */
    checkoutTag(tag) {
        assert.string(tag);
        exec(`git checkout ${tag}`);
    },

    /**
     * checks if the current working git tree is dirty.
     * @return {Boolean}
     */
    isDirty() {
        return exec('git status --porcelain') !== '';
    }
};

/**
 * execute a command synchronously using child_process. log the command and
 * the raw output before returning it.
 * @param {String} cmd a string command to execute
 * @return {String} the raw output
 */
function exec(cmd) {
    log.debug('executing command:\n' + cmd);

    const cmdOutput = execSync(cmd).toString();
    log.debug(`command output:\n${cmdOutput}`);
    log.debug('command success!');

    return cmdOutput;
}

module.exports = git;
