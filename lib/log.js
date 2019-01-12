'use strict';

const assert = require('assert-plus');
const lj = require('lumberjill');

// local globals
let log;
const exportedPojo = {};

function init(level) {
    assert.optionalNumber(level, 'level');

    log = lj.create({
        name: 'git-tag-changelog',
        level: level || 30
    });

    exportedPojo.trace = log.trace.bind(log);
    exportedPojo.debug = log.debug.bind(log);
    exportedPojo.info = log.info.bind(log);
    exportedPojo.warn = log.warn.bind(log);
    exportedPojo.error = log.error.bind(log);
    exportedPojo.fatal = function fatal() {
        log.fatal.apply(log, arguments);
        process.exit(1);
    };
    exportedPojo.exit = function infoAndExit() {
        log.info.apply(log, arguments);
        process.exit();
    };
}

function fail(msg) {
    log.fatal(msg);
    process.exit(1);
}

module.exports = Object.assign(exportedPojo, {
    init,
    fail
});
