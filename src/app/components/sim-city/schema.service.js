(function() {
    'use strict';

    angular
        .module('simCitySimDirective')
        .service('SchemaService', SchemaService);

    function SchemaService($resource, $log, $filter) {
        var customTypes = {};
        var model = {};

        var service = {
            addCustomTypeHandler: addCustomTypeHandler,
            setFormModel: setFormModel,
            modelAddValue: modelAddValue,
            modelUpdateValue: modelUpdateValue,
            modelDeleteValue: modelDeleteValue,
            getSchema: getSchema
        };
        return service;

        function setFormModel(model) {
            this.model = model;
        }

        function modelAddValue(key, type, value) {
            if (typeof (this.model[key]) === 'undefined') {
                if (type === 'list') {
                    this.model[key] = [];
                }
            }
            if (type === 'list') {
                this.model[key].push(value);
            } else {
                this.model.key = value;
            }
        }

        function modelUpdateValue(key, type, value) {
            _updateModelValue(this.model, key, type, value, 'update');
        }

        function modelDeleteValue(key, type, value) {
            _updateModelValue(this.model, key, type, value, 'delete');
        }

        function _updateModelValue(model, key, type, value, action) {
            if (type === 'list') {
                var index = model[key].map(function(f) { return f.id }).indexOf(value.id);

                if (action === 'delete') {
                    model[key].splice(index, 1)
                } else if (action === 'update') {
                    model[key][index] = value;
                }
            } else {
                if (action === 'delete') {
                    model.key = undefined
                } else if (action === 'update') {
                    model.key = value;
                }
            }
        }

        // Handler should be function(schema, form) {}
        function addCustomTypeHandler(type, handler) {
            customTypes[type] = handler;
        }

        function getSchema(schemaURL) {
            var schema = $resource(schemaURL);
            var request = schema.get();
            return request.$promise.then(parseSchema);
        }

        function parseSchema(data) {
            var newSchema = {
                type: 'object',
                properties: {}
            };
            var newForm = [];

            // Transform Resource object to JSON
            data = data.toJSON();
            data.parameters.forEach(function(item) {
                applyRulesForItem(item, newSchema, newForm, newForm);
            });

            return {
                schema: newSchema,
                form: newForm
            };
        }

        function applyRulesForItem(parameter, schema, form, mainForm) {
            var rules = {
                name: function(param, schema, form) { },
                type: function(param, schema, form) {
                    var paramType = param['type'];
                    var typeMappings = {
                        'str': 'string',
                        'number': 'number',
                        'list': 'array'
                    };

                    if (customTypes[paramType]) {
                        var customTypeFun = customTypes[paramType];
                        customTypeFun(schema, form, mainForm);
                    } else if (typeMappings[paramType]) {
                        schema['type'] = typeMappings[paramType];
                    } else {
                        $log.debug('SchemaService: no mapping known for type: ' + paramType);
                        schema['type'] = paramType;
                    }
                },
                contents: function(param, schema, form) {
                    schema['items'] = {
                        type: 'object',
                        properties: {}
                    };
                    form['items'] = [];
                    param['contents'].name = param['contents'].name || '_unnamed';
                    applyRulesForItem(param['contents'], schema['items'], form['items'], mainForm);
                },
                min_length: function(param, schema, form) {
                    schema['minLength'] = Number(param['min_length']);
                },
                max_length: function(param, schema, form) {
                    schema['maxLength'] = Number(param['max_length']);
                },
                default: function(param, schema, form) {
                    if (param['type'] === 'number') {
                        schema['default'] = Number(param['default']);
                    }
                },
                title: function(param, schema, form) {
                    schema['title'] = param['title'];
                },
                description: function(param, schema, form) {
                    schema['description'] = param['description'];
                },
                min: function(param, schema, form) {
                    form['min'] = param['min'];
                },
                max: function(param, schema, form) {
                    form['max'] = param['max'];
                },
                startEmpty: function(param, schema, form) {
                    form['startEmpty'] = param['startEmpty']
                },
                add: function(param, schema, form) {
                    form['add'] = param['add']
                },
                remove: function(param, schema, form) {
                    form['remove'] = param['remove']
                },
                layer: function(param, schema, form) {
                    schema['layer'] = param['layer']
                },
                featureId: function(param, schema, form) {
                    schema['featureId'] = param['featureId']
                }
            };

            if (!('name' in parameter)) {
                $log.debug('No name present in parameter! Cannot process further.');
                return;
            }
            var name = parameter['name'];

            var schemaItem = {};
            var formItem = { key: name };

            for (var key in parameter) {
                if (key !== 'type' && key in rules) {
                    var rule = rules[key];
                    rule(parameter, schemaItem, formItem, mainForm);
                } else {
                    $log.debug('SchemaService: no rule know for key: ' + key);
                }
            }
            // Perform type handlers last so they can use the other values
            if ('type' in parameter) {
                var rule = rules['type'];
                rule(parameter, schemaItem, formItem, mainForm);
            }

            schema.properties[name] = schemaItem;
            form.push(formItem);
        }
    }
})();
