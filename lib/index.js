/**
 * AppErrors file.
 *
 * @license Apache-2.0
 * @author Shiryaev Andrey <grabzila@gmail.com>
 * @copyright Shiryaev Andrey <grabzila@gmail.com> 2017
 */

'use strict';

/**
 * @type {{Validator: Validator, DataFilter: DataFilter}}
 */
module.exports = {
    Validator: require('./Validator'),
    DataFilter: require('./DataFilter'),
};
