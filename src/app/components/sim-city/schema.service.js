(function () {
    'use strict';

    angular
        .module('simCitySimDirective')
        .service('SchemaService', SchemaService);

    function SchemaService($http, $log) {
        var _this = this;
        _this.customTypes = {};
        _this.model = {};
        return {
            addCustomTypeHandler: addCustomTypeHandler,
            setFormModel: setFormModel,
            modelAddValue: modelAddValue,
            modelUpdateValue: modelUpdateValue,
            modelDeleteValue: modelDeleteValue,
            getSchema: getSchema
        };

        function setFormModel(model) {
            _this.model = model;
        }

        function modelAddValue(key, type, value) {
            if (typeof (_this.model[key]) === 'undefined') {
                if (type === 'list') {
                    _this.model[key] = [];
                }
            }
            if (type === 'list') {
                _this.model[key].push(value);
            } else {
                _this.model.key = value;
            }
        }

        function modelUpdateValue(key, type, value) {
            _updateModelValue(_this.model, key, type, value, 'update');
        }

        function modelDeleteValue(key, type, value) {
            _updateModelValue(_this.model, key, type, value, 'delete');
        }

        function _updateModelValue(model, key, type, value, action) {
            if (type === 'list') {
                var index = model[key].map(function (f) {
                    return f.id
                }).indexOf(value.id);

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
            _this.customTypes[type] = handler;
        }

        function getSchema(webserviceUrl, model, version) {
            return getSchemaFromURL(webserviceUrl + '/simulate/' + model + '/' + version);
        }

        function getSchemaFromURL(schemaURL) {
            return $http.get(schemaURL).then(parseSchema)
        }

        function parseSchema(data) {
            // Transform Resource object to JSON
            data = data.toJSON();

            var newSchema = {
                "type": "object",
                "properties": data.properties
            };
            var newForm = [];
            data.form.forEach(function (item) {
                applyRulesForItem(item, newSchema, newForm);
            });

            return {
                schema: newSchema,
                form: newForm
            };
        }

        function applyRulesForItem(formItem, schema, form) {
            var formRules = {
                type: function (formItem, schemaItem, form) {
                    var paramType = formItem['type'];
                    if (_this.customTypes[paramType]) {
                        var customTypeFun = _this.customTypes[paramType];
                        customTypeFun(formItem, schemaItem, form);
                    } else {
                        $log.debug('SchemaService: no mapping known for type: ' + paramType);
                        schema['type'] = paramType;
                    }
                },
                items: function (formItem, schemaItem, _form) {
                    var newItems = [];
                    formItem.items.forEach(function (item) {
                        applyRulesForItem(item, schemaItem.items, newItems)
                    });
                    formItem.items = newItems;
                },
                default: function (param, schema, _form) {
                    if (param['type'] === 'number') {
                        schema['default'] = Number(param['default']);
                    }
                }
            };

            var schemaRules = {
                minItems: function (formItem, schemaItem, _form) {
                    var key = formItem.key;
                    var minimum = schemaItem.minItems;
                    formItem['ngModel'] = function (ngModel) {
                        ngModel.$validators[key] = function (value) {
                            if (value && value.length) {
                                return value.length >= minimum;
                            } else {
                                return false;
                            }
                        };
                    };
                },
                maxItems: function (formItem, schemaItem, _form) {
                    var key = formItem.key;
                    var maximum = schemaItem.minItems;
                    formItem['ngModel'] = function (ngModel) {
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
                    name = undefined;
                    schemaItem = undefined;
                }

                for (var key in formItem) {
                    if (formItem.hasOwnProperty(key) && key !== 'type' && key in formRules) {
                        var rule = formRules[key];
                        rule(formItem, schemaItem, form);
                    } else {
                        $log.debug('SchemaService: no rule know for key: ' + key);
                    }
                }
                for (key in schemaItem) {
                    if (schemaItem.hasOwnProperty(key) && key !== 'type' && key in schemaRules) {
                        var schemaRule = schemaRules[key];
                        schemaRule(formItem, schemaItem, form);
                    } else {
                        $log.debug('SchemaService: no rule know for key: ' + key);
                    }
                }
                // Perform type handlers last so they can use the other values
                if ('type' in formItem) {
                    var typeRule = formRules['type'];
                    typeRule(formItem, schemaItem, form);
                }
            }

            if (angular.isDefined(schemaItem)) {
                schema.properties[name] = schemaItem;
            }
            form.push(formItem);
        }
    }
})();
