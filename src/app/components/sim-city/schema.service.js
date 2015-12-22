(function() {
  'use strict';

  angular
    .module('simCitySimDirective')
    .service('SchemaService', SchemaService);

  function SchemaService() {
    var service = {
      getSchema: getSchema
    };
    return service;

    function getSchema() {
      console.log('SchemaService.getSchema() =====');
    }
  }
})();
