(function() {
  'use strict';

  angular
    .module('simCitySimDirective')
    .service('SubmitSimulationService', SubmitSimulationService);

  function SubmitSimulationService($resource, $log) {
    var onSubmitHandlers = [];

    var service = {
      addOnSubmitHandler: addOnSubmitHandler,
      getOnSubmitHandlers: getOnSubmitHandlers,
      submit: submit
    };
    return service;

    // Handler should be function(schema, form) {}
    function addOnSubmitHandler(handler) {
      onSubmitHandlers.push(handler);
    }

    function getOnSubmitHandlers() {
        return onSubmitHandlers;
    }

    function submit(targetURL, parameters, callback) {
      var poster = $resource(targetURL, {},
         { send: { method: 'POST' } });
      var submited = poster.send(parameters);

      if(angular.isFunction(callback)) {
        return submited.$promise.then(callback);
      } else {
        return submited.$promise;
      }
    }
  }
})();
