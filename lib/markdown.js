'use strict';

const assert = require('assert-plus');
const _ = require('lodash');

/**
 * given an array of commit objects:
 * {
 *   sha: '80acf37f23493bf89c4a2ea162e3e276d7966313',
 *   type: 'Chore',
 *   typeDetail: undefined,
 *   message: '6.2.0 released, auto rev patch version'
 * }
 * prettify them into markdown.
 * @param {Array} commits an array of commit objects
 * @return {String}
 */
function groupedCommits(commits) {
    const grouped = _.reduce(
        commits,
        function (acc, commit) {
            assert.object(commit, 'commit');

            if (!acc.hasOwnProperty(commit.type)) {
                acc[commit.type] = [];
            }
            acc[commit.type].push(commit);

            return acc;
        },
        {}
    );

    let out = '';

    _.forEach(grouped, function (subCommits, commitType) {
        const typeStr =
            commitType === 'unknown'
                ? 'Unknown - Possibly Breaking??'
                : _.capitalize(commitType);

        out += `#### ${typeStr}\n`;
        _.forEach(subCommits, function (commit) {
            out += '* ';

            if (commit.typeDetail) {
                out += `${commit.typeDetail} `;
            }

            out += `${commit.message}\n`;
        });
        out += '\n';
    });

    // lop off last new line char
    return out.slice(0, -1);
}

module.exports = {
    groupedCommits
};
