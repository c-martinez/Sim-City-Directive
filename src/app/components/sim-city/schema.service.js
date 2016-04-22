(function() {
  'use strict';

  angular
    .module('simCitySimDirective')
    .service('SchemaService', SchemaService);

  function SchemaService($resource, $log) {
    var customTypes = {};
    var model = {};

    var service = {
      addCustomTypeHandler: addCustomTypeHandler,
      setFormModel: setFormModel,
      modelAddValue: modelAddValue,
      getSchema: getSchema
    };
    return service;
    
    function setFormModel(model) {
        this.model = model;
    }
    
    function modelAddValue(key, type, value) {
        if (typeof(this.model[key]) === 'undefined') {
            if (type == 'list') {
                this.model[key] = [];
            }
        }
        if (type == 'list') {
             this.model[key].push(value);
        } else {
            this.model.key = value;
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
      var newForm   = [];

      // Transform Resource object to JSON
      data = data.toJSON();
      data.parameters.forEach(function(item) {
        applyRulesForItem(item, newSchema, newForm);
      });

      return {
        schema: newSchema,
        form:   newForm
      };
    }

    function applyRulesForItem(parameter, schema, form) {
      var rules = {
        name: function(param, schema, form) {},
        type: function(param, schema, form) {
          var paramType = param['type'];
          var typeMappings = {
            'str': 'string',
            'number': 'number',
            'list': 'array'
          };

          if(customTypes[paramType]) {
            var customTypeFun = customTypes[paramType];
            customTypeFun(schema, form);
          } else if(typeMappings[paramType]) {
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
          applyRulesForItem(param['contents'], schema['items'], form['items']);
        },
        min_length: function(param, schema, form) {
          schema['minLength'] = Number(param['min_length']);
        },
        max_length: function(param, schema, form) {
          schema['maxLength'] = Number(param['max_length']);
        },
        default: function(param, schema, form) {
          if ( param['type'] === 'number' ) {
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
        }
      };

      if(!('name' in parameter)) {
        $log.debug('No name present in parameter! Cannot process further.');
        return;
      }
      var name = parameter['name'];

      var schemaItem = {};
      var formItem = { key: name };

      for(var key in parameter) {
        if(key in rules) {
          var rule = rules[key];
          rule(parameter, schemaItem, formItem);
        } else {
          $log.debug('SchemaService: no rule know for key: ' + key);
        }
      }

      schema.properties[name] = schemaItem;
      form.push(formItem);
    }
  }
})();
