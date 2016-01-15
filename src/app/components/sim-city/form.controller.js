(function() {
  'use strict';

  angular
    .module('simCitySimDirective')
    .controller('FormController', FormController);

  function FormController(SchemaService) {
    var vm = this;

    vm.schema = {};
    vm.form = [];
    vm.model = {};
    vm.debugText = 'xxx';

    // Functions the controller exposes
    vm.doStuff = doStuff;
    vm.onSubmit = onSubmit;

    // Initialize controller
    SchemaService.getSchema(vm.schemaurl).then(
      function(data) {
        vm.debugText = SchemaService.debug.text;
        vm.schema = data.schema;
        vm.form = data.form;
      }
    );

    function onSubmit(form) {
      console.log('Doing validate yo!');
      console.log(vm.model);

      // Then we check if the form is valid
      if (form.$valid) {
        console.log('All cool dude! Go submit!');
        // ... do whatever you need to do with your data.
      }
    }

    function doStuff() {
      console.log('Doing stuff...');
    }
  }
})();
