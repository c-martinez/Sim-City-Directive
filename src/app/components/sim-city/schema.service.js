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
        ensamble  : { type: 'string', minLength: 1, title: 'ensemble name' },
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
          items: { type: 'object' }
        },

        "comments": {
          "type": "array",
          "maxItems": 2,
          "items": {
            "type": "object",
            "properties": {
              "spam": {
                "title": "Spam",
                "type": "string"
              },
              "comment": {
                "title": "Comment",
                "type": "string",
              }
            }
          }
        }
      }
    };

    // TODO: form should be loaded from http://localhost:9090/explore/simulate/matsim/0.4
    var dummyForm = [
      'ensamble',
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
      { key: 'fires'},
      {
        "key": "comments",
        "items": [
          {
            "key": "comments[].spam",
            "type": "template",
            template: '<b>I am template!</b>',
            "title": "Yes I want spam."
          },
          {
            "key": "comments[].comment",
            "type": "textarea"
          }
        ]
      },

      {
        type: 'submit',
        title: 'Save'
      }
    ];

    var customTypes = {};
    // TODO: add function to append custom types
    customTypes['point2d'] = function(schema, form) {
      schema['items'] = { 'type': 'object' };
      form['type'] = 'template';
      form['template'] = '<h1 ng-click="form.foo()">Yo {{form.fireStations}}!</h1>';
    };

    var debug = {};
    var service = {
      getSchema: getSchema,
      debug: debug
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

      newSchema = dummySchema;
      newForm   = dummyForm;
      debug.text = JSON.stringify(newForm, '<br>', 2);
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
          } else {
            schema['type'] = typeMappings[paramType] || paramType;
          }

        },
        contents: function(param, schema, form) {
          // TODO: properly implement this...
          console.log();
          if (param['contents'].type==='point2d') {
            // point2d
            schema['items'] = { 'type': 'object' };
            form['type'] = 'template';
            form['template'] = '<h1 ng-click="form.foo()">Yo {{form.fireStations}}!</h1>';
          } else {
            schema['items'] = { 'type': 'string' };
          }
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
          $log.debug('SchemaService: no rule know for key - ' + key);
        }
      }

      schema.properties[name] = schemaItem;
      form.push(formItem);
    }
  }
})();
