(function() {
  'use strict';

  angular
    .module('simCitySimDirective')
    .run(runBlock);

  /** @ngInject */
  function runBlock($log, SchemaService) {
    SchemaService.addCustomTypeHandler('point2d', function(formItem, _schemaItem, _form) {
       formItem['type'] = 'template'
       formItem['template'] = '<div ng-if="item.id">{{item.id}}</div><div ng-if="!item.id">({{item.x}}, {{item.y}})</div>'
    });
  }

})();
