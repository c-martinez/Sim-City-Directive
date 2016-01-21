(function() {
  'use strict';

  angular
    .module('simCitySimDirective')
    .service('SubmitSimulationService', SubmitSimulationService);

  function SubmitSimulationService($resource, $log) {
    var service = {
      submit: submit
    };
    return service;

    function submit(targetURL, parameters, callback) {
      var poster = $resource(targetURL, {},
         { send: { method: 'GET' } });
      var submited = poster.send(parameters);

      if(typeof callback === 'function') {
        return submited.$promise.then(callback);
      } else {
        return submited.$promise;
      }
    }
  }
})();
