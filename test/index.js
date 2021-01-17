'use strict';

// external modules
const execSync = require('child_process').execSync;

describe('git-tag-changelog', function() {
    it('should be awesome', function(cb) {
        execSync('bin/cli.js -h');
        return cb();
    });
});
