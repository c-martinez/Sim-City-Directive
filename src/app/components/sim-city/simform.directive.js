(function() {
  'use strict';

  angular
    .module('simCitySimDirective')
    .directive('simForm', SimForm);

  function SimForm() {
    var directive = {
        templateUrl: 'app/components/sim-city/simForm.directive.html',
        scope: {
            schemaurl: '@'
        },
        controller: 'FormController',
        controllerAs: 'vm',
        bindToController: true
    };
    return directive;
  }
})();
