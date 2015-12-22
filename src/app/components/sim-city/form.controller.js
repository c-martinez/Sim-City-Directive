(function() {
  'use strict';

  angular
    .module('simCitySimDirective')
    .controller('FormController', FormController);

  function FormController($scope, SchemaService) {
    var vm = this;
    vm.doStuff = doStuff;
    vm.onSubmit = onSubmit;

    $scope.schema = {
      type: "object",
      properties: {
        name: { type: "string", minLength: 2, title: "Name", description: "Name or alias" },
        title: { type: "string", enum: ['dr','jr','sir','mrs','mr','NaN','dj'] }
      }
    };

    $scope.form = [
      "name",
      "title",
      {
        type: "submit",
        title: "Save"
      }
    ];

    $scope.model = {};

    function onSubmit(form) {
      console.log('Doing validate yo!');
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
      SchemaService.getSchema();
    }
  }
})();
