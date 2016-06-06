(function () {
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
            restrict: 'E',
            scope: {
                webserviceUrl: '@simWebserviceUrl',
                formMessageHandler: '&simFormMessageHandler',
                model: '=simModel',
                schema: '=simSchema'
            },
            controller: 'SimFormController',
            controllerAs: 'vm',
            bindToController: true
        };
        return directive;
    }
})();
