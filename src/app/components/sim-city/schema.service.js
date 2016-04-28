(function() {
    'use strict';

    angular
        .module('simCitySimDirective')
        .service('SchemaService', SchemaService);

    function SchemaService($resource, $log, $filter, $q, $timeout) {
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
            // Transform Resource object to JSON
            data = data.toJSON();
            
            var newSchema = {
                "type": "object",
                "properties": data.properties
            }
            var newForm = [];
            data.form.forEach(function(item) {
                applyRulesForItem(item, newSchema, newForm);
            });

            return {
                schema: newSchema,
                form: newForm
            };
        }

        function applyRulesForItem(formItem, schema, form) {
            var formRules = {
                type: function(formItem, schemaItem, form) {
                    var paramType = formItem['type'];
                    if (customTypes[paramType]) {
                        var customTypeFun = customTypes[paramType];
                        customTypeFun(formItem, schemaItem, form);
                    } else {
                        $log.debug('SchemaService: no mapping known for type: ' + paramType);
                        schema['type'] = paramType;
                    }
                },
                items: function(formItem, schemaItem, form) {
                    var newItems = [];
                    formItem.items.forEach(function(item){
                       applyRulesForItem(item, schemaItem.items, newItems) 
                    });
                    formItem.items = newItems;
                },
                default: function(param, schema, form) {
                    if (param['type'] === 'number') {
                        schema['default'] = Number(param['default']);
                    }
                }
            };
            
            var schemaRules = {
                minItems: function(formItem, schemaItem, form) {   
                    var key = formItem.key;
                    var minimum = schemaItem.minItems;           
                    formItem['ngModel'] = function(ngModel){
                         ngModel.$validators[key] = function (value) {
                            if (value && value.length) {
                                return value.length >= minimum;
                            } else {
                                return false;
                            }
                        };
                    };
                },
                maxItems: function(formItem, schemaItem, form) {   
                    var key = formItem.key;
                    var maximum = schemaItem.minItems;           
                    formItem['ngModel'] = function(ngModel){
                         ngModel.$validators[key] = function (value) {
                            if (value && value.length) {
                                return value.length <= maximum;
                            } else {
                                return false;
                            }
                        };
                    };
                }
            };
            
            var name;
            var schemaItem;
            if (angular.isString(formItem)) {
                name = formItem;
                schemaItem = schema.properties[name];
            } else {
                if ('key' in formItem) {
                    name = formItem.key;
                    schemaItem = schema.properties[name];
                } else {
                    name = undefined
                    schemaItem = undefined
                }
 
                for (var key in formItem) {
                    if (key !== 'type' && key in formRules) {
                        var rule = formRules[key];
                        rule(formItem, schemaItem, form);
                    } else {
                        $log.debug('SchemaService: no rule know for key: ' + key);
                    }
                }
                for (var key in schemaItem) {
                    if (key !== 'type' && key in schemaRules) {
                        var schemarule = schemaRules[key];
                        schemarule(formItem, schemaItem, form);
                    } else {
                        $log.debug('SchemaService: no rule know for key: ' + key);
                    }
                }
                // Perform type handlers last so they can use the other values
                if ('type' in formItem) {
                    var typerule = formRules['type'];
                    typerule(formItem, schemaItem, form);
                }
            }

            if (angular.isDefined(schemaItem)) {
                schema.properties[name] = schemaItem;
            }
            form.push(formItem);
        }
    }
})();
