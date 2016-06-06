(function () {
    'use strict';

    angular
        .module('simCitySimDirective')
        .config(config);

    /** @ngInject */
    function config($logProvider) {
        // Enable log
        $logProvider.debugEnabled(true);
    }
})();
