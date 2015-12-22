(function() {
  'use strict';

  angular
    .module('simCitySimDirective')
    .run(runBlock);

  /** @ngInject */
  function runBlock($log) {

    $log.debug('runBlock end');
  }

})();
