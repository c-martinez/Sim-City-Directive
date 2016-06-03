(function() {
  'use strict';

  angular
    .module('simCitySimDirective')
    .controller('FormController', FormController);

  function FormController($scope, $timeout, $log, SchemaService, SubmitSimulationService) {
    var vm = this;

    vm.schema = {};
    vm.form = [];
    vm.model = {};
    vm.hidden = true;
    vm.versionHidden = true;
    vm.startFade = false;
    vm.message = '';
    vm.simulationFormHidden = true;
    vm.simulationOptions = [];
    vm.versionOptions = [];
    vm.simulationSelected = {
        simulation: {},
        version: {}
    };

    // Functions the controller exposes
    vm.onSubmit = onSubmit;

    // Initialize controller
    // the vm.simulationurl should already be set by angular
    // try {
    //   vm.simulationurl = $scope.$parent.widget.data.schemaurl;
    // } catch(e) {
    //   // Do nothing...
    // }

    if(vm.webserviceUrl) {
      SchemaService.getJson(vm.webserviceUrl).then(
        function(data) {
          data.simulations.forEach(function(item) {
            vm.simulationOptions.push({
              "label": item,
              "value": vm.webserviceUrl+"/"+item
            })
          })
        }
      );
    } else {
      $log.debug('SimCityDirective.FormController: no URL provided');
    }

    // Add the model of this form to the schema service so it can be updated
    SchemaService.setFormModel(vm.model);

    vm.simulationChanged = function () {
      vm.simulationUrl = vm.simulationSelected.simulation.value
      SchemaService.getJson(vm.simulationUrl).then(
        function(data) {
          vm.simulation = data.toJSON();
          vm.versionHidden = false;
          Object.keys(vm.simulation).forEach(function(key){
            vm.versionOptions.push({
              "label": key,
              "value": vm.simulationUrl+"/"+key
            })
          });
        }
      );
    }

    vm.simulationVersionChanged = function() {
      vm.simulationUrl = vm.simulationSelected.version.value
      SchemaService.getSchema(vm.simulationUrl).then(
        function(data) {
          vm.schema = data.schema;
          vm.form = data.form;

          vm.simulationFormHidden = false;
          $scope.$broadcast('schemaFormValidate')
        }
      );
    }

    function onSubmit(form) {
      var onSubmitHandlers = SubmitSimulationService.getOnSubmitHandlers();
      angular.forEach(onSubmitHandlers, function(handler) {
        handler(vm.schema, vm.model);
      });

      // Then we check if the form is valid
      if (form.$valid) {
        SubmitSimulationService.submit(vm.schemaurl,
          vm.model, function() {
            flashMessage('Form has been submitted!');
          });
      }
    }

    function flashMessage(msg) {
      vm.message = msg;
      vm.hidden = false;  // Show
      vm.startFade = false;

      // After 5 seconds, fade
      $timeout(function(){
        vm.startFade = true;
        // and then hide
        $timeout(function(){ vm.hidden = true; }, 500);
      }, 2000);
    }
  }
})();
