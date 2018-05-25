# not-magical-validator
More functional wrapper over "@claud/checkit". This validator has "scenario" and "filters".

* Scenarios will help you delete those data that should not be in the object.
* Filters will help you bring the data to the right kind, before checking them.

## Base example.

```javascript
const { Validator } = require('@claud/not-magical-validator');

const schema = {};
schema.scenarios = {
    default: ['title', 'slug'],
};
schema.filters = [[['title', 'slug'], 'toString']];
schema.validators = {
    title: [
        'required',
        'string',
        'maxLength:225',
        'minLength:1',
        {
            /**
             * @this {Runner} This is a Runner object form @claud/checkit
             * @param {*} value
             * @param {*} params
             * @param {*} context
             */
            rule(value, params, context) {
                return true;
            },
        },
    ],
    slug: [
        'required',
        'string',
        'minLength:1'
    ],
};

async function validator(data, options, name = 'default', scenario = 'default') {
    let validatorInstance = Validator.getValidator(name);
    if (!(validatorInstance instanceof Validator)) {
        validatorInstance = new Validator(options);
        Validator.registration(name, validatorInstance);
    }
    return await validatorInstance.validate(data, {}, scenario);
}

validator(data, schema).then((data) => {
    // ...
});
```

## Example of model for [objection.js](https://vincit.github.io/objection.js/)

```javascript

const _ = require('lodash');
const { Validator } = require('@claud/not-magical-validator');
const winston = require('winston');
const { Model }  = require('objection');

class ArticleModel extends Model {
    /**
     * @return {string}
     */
    static get tableName() {
        return 'articles';
    }
    
    /**
     * @return {{}}
     */
    static getValidationRules() {
        const schema = {};
        schema.scenarios = {
            default: ['title', 'slug'],
            create: ['title', 'slug'],
            update: ['title', 'slug'],
        };
        schema.filters = [[['title', 'slug'], 'toString']];
        schema.validators = {
            title: [
                'required',
                'string',
                'maxLength:225',
                'minLength:1',
                {
                    scenarios: ['create', 'update'],
                    rule: CommonValidators.uniqueDbValue(ArticleModel, 'title'),
                },
            ],
            slug: [
                'required',
                'string',
                'minLength:1',
                {
                    scenarios: ['create', 'update'],
                    rule: CommonValidators.uniqueDbValue(ArticleModel, 'slug'),
                },
            ],
        };
        return schema;
    }
    
    /**
     * Options can be change in this method.
     *
     * @protected
     * @param {object} options {@link validate}
     * @return {*}
     */
    static beforeValidation(options) {
        return void 0;
    }
    
    /**
     * @protected
     * @param {object} dataAfterValidation
     * @param {object} options {@link validate}
     * @return {*} New "dataAfterValidation" object.
     */
    static afterValidation(dataAfterValidation, options) {
        return void 0;
    } 
    
    /**
      * @param {object} options
      * @param {object} options.runtimeContext
      * @param {object} options.data
      * @param {object?} options.oldModel
      * @param {string} [options.scenario=default]
      * @return {Promise<object>} A new object with valid data.
      */
    static async validate(options) {
        // Options can be change in this method.
        await this.beforeValidation(options);

        let { runtimeContext, data, oldModel, scenario = 'default' } = options;
        const context = { runtimeContext };

        if (!_.isEmpty(oldModel)) {
            data = Validator.difference(data, oldModel);
            context.oldModel = oldModel;
            winston.debug(`Calculation diff data for model "${this.name}".`, {
                originData: options.data,
                newData: data,
                oldModel,
            });
        }
        let validatorInstance = Validator.getValidator(this.name);
        if (!(validatorInstance instanceof Validator)) {
            const options = this.getValidationRules();
            if (_.isEmpty(options)) {
                winston.debug(`Validation rules in model "${this.name}" is not defined.`);
                return data;
            }
            options.checkitOptions = { language: 'en' };
            validatorInstance = new Validator(options);
            Validator.registration(this.name, validatorInstance);
        }
        data = await validatorInstance.validate(data, context, scenario);
        data = await this.afterValidation(data, options);
        return data;
    }
}

```

Using validator.

``` javascript 
const data = await ArticleModel.validate({
    runtimeContext: {},
    data: {
        // Validator will change this field to the type "string".
        title: 1111, 
        slug: 'test',
        // Validator will remove this field because it is not supported in scenario "create".
        notInScenario: 11111 
    },
    'create',
});
console.log(data);

// > { title: "1111", slug: "test" }

```

## Conclusion

For more details, see jsdoc in code.

> I am from Russia and my English very bad. If you want help me with documents, i will be happy. :) 