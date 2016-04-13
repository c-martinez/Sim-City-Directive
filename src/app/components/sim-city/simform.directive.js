(function() {
  'use strict';

  // var scripts = document.getElementsByTagName("script")
  // var currentScriptPath = scripts[scripts.length-1].src;

  angular
    .module('simCitySimDirective')
    .directive('simForm', SimForm);

  function SimForm() {
    var directive = {
        // templateUrl: currentScriptPath.replace('directive.js', 'directive.html'),  // Dev code
        templateUrl: 'app/components/sim-city/simform.directive.html',
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
