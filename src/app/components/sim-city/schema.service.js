(function() {
  'use strict';

  angular
    .module('simCitySimDirective')
    .service('SchemaService', SchemaService);

  function SchemaService($resource, $log) {
    // TODO: schema should be loaded from http://localhost:9090/explore/simulate/matsim/0.4
    var dummySchema = {
      type: 'object',
      properties: {
        ensemble  : { type: 'string', minLength: 1, title: 'ensemble name' },
        simulation: { type: 'string', minLength: 1, title: 'scenario name' },
        populationSampleFactor:
                    { type: 'number', default: 1,
                    validationMessage: 'Invalid value',
                    step: 5,
                    description: 'percentage of the population (totalling 8.5 million) that commutes' },
        fireStations: {
          type: 'array',
          minLength: 1,
          title: 'Fire stations',
          items: { type: 'object' }
        },
        fires: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              location: {
                type: 'point2d'
              }
            }
          }
        }
      }
    };

    // TODO: form should be loaded from http://localhost:9090/explore/simulate/matsim/0.4
    var dummyForm = [
      'ensemble',
      'simulation',
      {
        key: 'populationSampleFactor',
        min: '0',
        max: '100',
        $validators: [ function(value) { return (value>=0 && value<=100); } ]
      },
      {
        key: 'fireStations',
        type: 'template',
        template: '<h1 ng-click="form.foo()">Yo {{form.fireStations}}!</h1>',
        foo: function() {
          console.log('oh noes!');
          console.log(this);
        }
      },
      { key: 'fires',
        items: [
          {
            key: 'fires[].location',
            type: 'template',
            template: '<b>We are template!</b>'
          }
        ]
      },
      {
        type: 'submit',
        title: 'Save'
      }
    ];

    var customTypes = {};
    function addCustomTypeHandler(type, handler) {
      // Handler should be function(schema, form) {}
      customTypes[type] = handler;
    }

    var service = {
      getSchema: getSchema,
      addCustomTypeHandler: addCustomTypeHandler,
    };
    return service;

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
