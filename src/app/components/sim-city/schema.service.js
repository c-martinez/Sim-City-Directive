(function() {
  'use strict';

  angular
    .module('simCitySimDirective')
    .service('SchemaService', SchemaService);

  function SchemaService($resource) {
    // TODO: schema should be loaded from http://localhost:9090/explore/simulate/matsim/0.4
    var dummySchema = {
      type: 'object',
      properties: {
        ensamble  : { type: 'string', minLength: 1, title: 'ensemble name' },
        simulation: { type: 'string', minLength: 1, title: 'scenario name' },
        populationSampleFactor:
                    { type: 'number', default: 1,
                    validationMessage: 'Invalid value',
                    description: 'percentage of the population (totalling 8.5 million) that commutes' },
        fireStations: {
          type: 'array',
          minLength: 1,
          title: 'Fire stations',
          items: { type: 'string' }
        },
        fires: {
          type: 'array',
          maxLength: 1,
          title: 'Fire',
          items: { type: 'string' }
        }
      }
    };

    // TODO: form should be loaded from http://localhost:9090/explore/simulate/matsim/0.4
    var dummyForm = [
      'ensamble',
      'simulation',
      {
        key: 'populationSampleFactor',
        $validators: [ function(value) { return (value>0 && value<5); } ]
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
      'fires',
      {
        type: 'submit',
        title: 'Save'
      }
    ];

    var service = {
      getSchema: getSchema
    };
    return service;


    function getSchema(schemaURL) {
      var schema = $resource(schemaURL);
      var request = schema.get();

      return request.$promise.then(function(data) {
        // TODO: parse 'data' to create schema and form
        return {
          schema: dummySchema,
          form:   dummyForm
        };
      });
    }
  }
})();
