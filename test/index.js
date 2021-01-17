'use strict';

// external modules
const assert = require('chai').assert;
const execSync = require('child_process').execSync;

describe('git-tag-changelog', function () {
    it('should run cli and show help message', function (cb) {
        const output = execSync('bin/cli.js -h').toString();
        assert.include(output, 'usage: cl [ACTION] [OPTIONS]');
        return cb();
    });
});
