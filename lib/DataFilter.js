/**
 * DataFilter file.
 *
 * @license Apache-2.0
 * @author Shiryaev Andrey <grabzila@gmail.com>
 * @copyright Shiryaev Andrey <grabzila@gmail.com> 2017
 */

'use strict';

const _ = require('lodash');

class DataFilter {
    static toStringSkipNull(data, attributeName) {
        if (data !== null && !_.isString(data)) {
            data = String(data);
        }
        return data;
    }

    static emptyStringToNull(data, attributeName) {
        if (_.isString(data) && data === '') {
            data = null;
        }
        return data;
    }

    static toString(data, attributeName) {
        if (!_.isString(data)) {
            data = String(data);
        }
        return data;
    }

    static trim(data, attributeName) {
        if (_.isString(data)) {
            data = data.trim();
        }
        return data;
    }

    static toLowerCase(data, attributeName) {
        if (_.isString(data)) {
            data = data.toLowerCase();
        }
        return data;
    }

    static parseInt(data, attributeName) {
        return parseInt(data);
    }

    static NaNTo0(data, attributeName) {
        if (_.isNaN(data)) {
            data = 0;
        }
        return data;
    }
}

module.exports = DataFilter;
