'use strict';

/**
 * Say hello
 * @public
 * @param {String} [name=Jane] - name of the person
 * @returns {String}
 * @example
 * <caption>
 * With default name
 * </caption>
 * sayHello();
 * @example
 * sayHello('John');
 */
function sayHello(name = 'Jane') {
    return `hello ${name}`;
}

module.exports = {
    sayHello
};
