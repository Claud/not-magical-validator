/**
 * Validator file.
 *
 * @license Apache-2.0
 * @author Shiryaev Andrey <grabzila@gmail.com>
 * @copyright Shiryaev Andrey <grabzila@gmail.com> 2017
 */

'use strict';

const _ = require('lodash');
const checkit = require('@claud/checkit');
const DataFilter = require('./DataFilter');

let cache = new Map();

class Validator {
    /**
     * @param {object} options
     * @param {object} options.validators
     * @param {function|object} options.scenarios
     * @param {function|object} options.filters
     * @param {object} options.checkitOptions
     */
    constructor(options) {
        const { validators, scenarios = {}, filters = [], checkitOptions = {} } = options;
        this._checkitOptions = checkitOptions;

        this.checkitInstance = null;
        /**
         * Predefined filters.
         *
         * - toStringSkipNull
         * - emptyStringToNull
         * - toString
         * - trim
         * - toLowerCase
         * - parseInt
         * - NaNTo0
         *
         * @example
         * [
         *     [['email', 'login'], 'toStringSkipNull'],
         *     [['email'], 'trim'],
         *     [['email', 'login'], function(val, attributeName) { return `<< ${val} >> `; } ],
         * ]
         */
        this.filters = filters;
        /**
         * Object with scenarios or function, that returns an object with scenarios.
         *
         * ```
         * {
         *     'default': ['email', 'id', 'login'],
         *     'login': ['email', 'password'],
         * }
         * ```
         */
        this.scenarios = scenarios;
        /**
         * The validation rules are specified in this format:
         *
         * ```
         * // Full rule:
         * {
         *     email: [
         *         {
         *             scenarios: 'default',
         *             rule: 'string',
         *             when: 1 + 1 < 1,
         *         }
         *     ]
         * }
         * // Short rule:
         * {
         *     email: ['string']
         * }
         *
         * // Short rule:
         * {
         *     email: [
         *         'string',
         *         {
         *             scenarios: 'default',
         *             // That can't be an arrow function. Because you will lose the reference to "this".
         *             rule(value, params, context) { return true; },
         *         }
         *     ]
         * }
         * ```
         *
         * The rule will be triggered only when the scenario = default, and the condition "when" is true.
         *
         * rule - is defined as a rule for "checkit".
         * when - can be just boolean or a function that will return boolean.
         *
         * See more about the format {@link https://www.npmjs.com/package/@claud/checkit}
         */
        this.validators = validators;
    }

    /**
     * Main method for validation your data.
     *
     * @param {object} data
     * @param {object} context
     * @param {string} scenario
     * @return {Promise<object>} A new object with valid data.
     */
    async validate(data, context = {}, scenario = 'default') {
        if (!_.isPlainObject(data)) {
            throw new TypeError('"data" can be only a plain object.');
        }
        if (_.isEmpty(data)) {
            return data;
        }
        data = _.cloneDeep(data);
        if (scenario) {
            data = this.applyScenario(data, context, scenario);
        }
        if (!_.isEmpty(this.filters)) {
            data = this.applyFilter(data, context, scenario);
        }
        if (_.isEmpty(this.validators)) {
            return data;
        }
        if (!(this.checkitInstance instanceof checkit)) {
            this.checkitInstance = checkit(this.validators, this._checkitOptions);
        }
        // const validatedFields = await this.checkitInstance.validate(data, context, scenario);
        await this.checkitInstance.validate(data, context, scenario);
        return data;
    }

    /**
     * @param {object} data
     * @param {object} context
     * @param {string} scenario
     * @see validate
     * @private
     * @return {*}
     */
    applyFilter(data, context = {}, scenario = 'default') {
        let filters = {};
        if (_.isFunction(this.filters)) {
            filters = this.filters.call(this, scenario, context);
        } else {
            filters = this.filters;
        }
        if (!(_.isArray(filters) && !_.isEmpty(filters))) {
            return data;
        }
        for (const rule of filters) {
            let attrsInFilter = rule[0];
            if (!_.isArray(attrsInFilter)) {
                attrsInFilter = [attrsInFilter];
            }
            let filter = rule[1];
            for (const attrInFilter of attrsInFilter) {
                if (!_.has(data, attrInFilter)) {
                    continue;
                }
                if (_.isFunction(filter)) {
                    _.set(data, attrInFilter, filter.call(this, _.get(data, attrInFilter)), attrInFilter);
                } else if (_.isString(filter) && _.isFunction(DataFilter[filter])) {
                    _.set(data, attrInFilter, DataFilter[filter].call(this, _.get(data, attrInFilter), attrInFilter));
                } else {
                    throw new SyntaxError('Filter is not defined.');
                }
            }
        }
        return data;
    }

    /**
     * @param {object} data
     * @param {object} context
     * @param {string} scenario
     * @see validate
     * @private
     * @return {*}
     */
    applyScenario(data, context = {}, scenario = 'default') {
        let scenarios = {};
        if (_.isFunction(this.scenarios)) {
            scenarios = this.scenarios.call(this, scenario, context);
        } else {
            scenarios = this.scenarios;
        }
        if (scenario && !_.isEmpty(scenarios)) {
            if (!scenarios[scenario]) {
                throw new SyntaxError(`Scenario "${scenario}" is not found.`);
            }
            data = _.pick(data, scenarios[scenario]);
        }
        return data;
    }

    /**
     * Diff between two object.
     *
     * @param {Object} object Object compared.
     * @param {Object} baseObject Object to compare with.
     * @return {Object} Return a new object who represent the diff.
     */
    static difference(object, baseObject) {
        return _.transform(object, (result, value, key) => {
            if (!_.isEqual(value, baseObject[key])) {
                result[key] = value;
            }
        });
    }

    /**
     * @param {string} name
     * @param {Validator} instance
     */
    static registration(name, instance) {
        cache.set(String(name), instance);
    }

    /**
     * @param {string} name
     * @return {Validator}
     */
    static getValidator(name) {
        return cache.get(String(name));
    }
}

module.exports = Validator;
