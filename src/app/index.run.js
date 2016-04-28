(function() {
  'use strict';

  angular
    .module('simCitySimDirective')
    .run(runBlock);

  /** @ngInject */
  function runBlock($log, SchemaService) {
    SchemaService.addCustomTypeHandler('point2d', function(formItem, schemaItem, form) {
       formItem['type'] = 'template'
       formItem['template'] = '<div>({{item.x}}, {{item.y}})</div>'
    });
  }

})();
