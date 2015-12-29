(function() {
  'use strict';

  angular
    .module('simCitySimDirective')
    .controller('FormController', FormController);

  function FormController($scope, SchemaService) {
    var vm = this;
    vm.doStuff = doStuff;
    vm.onSubmit = onSubmit;

    // TODO: get URL from somewhere
    // var schemaURL = 'http://localhost:9090/explore/simulate/matsim/0.4';
    var schemaURL = 'dummy_matsim_0.4.json';
    SchemaService.getSchema(schemaURL).then(
      function(data) {
        $scope.schema = data.schema;
        $scope.form = data.form;
      }
    );

    $scope.schema = {};
    $scope.form = [];
    $scope.model = {};

    function onSubmit(form) {
      console.log('Doing validate yo!');
      console.log($scope.model);
      // First we broadcast an event so all fields validate themselves
      $scope.$broadcast('schemaFormValidate');

      // Then we check if the form is valid
      if (form.$valid) {
        console.log('All cool dude! Go submit!');
        // ... do whatever you need to do with your data.
      }
    }

    function doStuff() {
      console.log('Doing stuff...');
      // $scope.form.pop();
      // $scope.$broadcast('schemaFormRedraw')

      // $scope.$broadcast('schemaForm.error.name','?', 'Unvalid stuff message');
    }
  }
})();
