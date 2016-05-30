(function() {
  'use strict';

  angular
    .module('simCitySimDirective',
    [
      'ngResource',
      'ui.bootstrap',
      'toastr',
      'schemaForm'
    ]);
})();

(function() {
  'use strict';

  SubmitSimulationService.$inject = ["$resource", "$log"];
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

(function() {
    'use strict';

    SchemaService.$inject = ["$resource", "$log", "$filter", "$q", "$timeout"];
    angular
        .module('simCitySimDirective')
        .service('SchemaService', SchemaService);

    function SchemaService($resource, $log, $filter, $q, $timeout) {
        var customTypes = {};
        var model = {};

        var service = {
            addCustomTypeHandler: addCustomTypeHandler,
            setFormModel: setFormModel,
            modelAddValue: modelAddValue,
            modelUpdateValue: modelUpdateValue,
            modelDeleteValue: modelDeleteValue,
            getSchema: getSchema
        };
        return service;

        function setFormModel(model) {
            this.model = model;
        }

        function modelAddValue(key, type, value) {
            if (typeof (this.model[key]) === 'undefined') {
                if (type === 'list') {
                    this.model[key] = [];
                }
            }
            if (type === 'list') {
                this.model[key].push(value);
            } else {
                this.model.key = value;
            }
        }

        function modelUpdateValue(key, type, value) {
            _updateModelValue(this.model, key, type, value, 'update');
        }

        function modelDeleteValue(key, type, value) {
            _updateModelValue(this.model, key, type, value, 'delete');
        }

        function _updateModelValue(model, key, type, value, action) {
            if (type === 'list') {
                var index = model[key].map(function(f) { return f.id }).indexOf(value.id);

                if (action === 'delete') {
                    model[key].splice(index, 1)
                } else if (action === 'update') {
                    model[key][index] = value;
                }
            } else {
                if (action === 'delete') {
                    model.key = undefined
                } else if (action === 'update') {
                    model.key = value;
                }
            }
        }

        // Handler should be function(schema, form) {}
        function addCustomTypeHandler(type, handler) {
            customTypes[type] = handler;
        }

        function getSchema(schemaURL) {
            var schema = $resource(schemaURL);
            var request = schema.get();
            return request.$promise.then(parseSchema);
        }

        function parseSchema(data) {
            // Transform Resource object to JSON
            data = data.toJSON();
            
            var newSchema = {
                "type": "object",
                "properties": data.properties
            }
            var newForm = [];
            data.form.forEach(function(item) {
                applyRulesForItem(item, newSchema, newForm);
            });

            return {
                schema: newSchema,
                form: newForm
            };
        }

        function applyRulesForItem(formItem, schema, form) {
            var formRules = {
                type: function(formItem, schemaItem, form) {
                    var paramType = formItem['type'];
                    if (customTypes[paramType]) {
                        var customTypeFun = customTypes[paramType];
                        customTypeFun(formItem, schemaItem, form);
                    } else {
                        $log.debug('SchemaService: no mapping known for type: ' + paramType);
                        schema['type'] = paramType;
                    }
                },
                items: function(formItem, schemaItem, form) {
                    var newItems = [];
                    formItem.items.forEach(function(item){
                       applyRulesForItem(item, schemaItem.items, newItems) 
                    });
                    formItem.items = newItems;
                },
                default: function(param, schema, form) {
                    if (param['type'] === 'number') {
                        schema['default'] = Number(param['default']);
                    }
                }
            };
            
            var schemaRules = {
                minItems: function(formItem, schemaItem, form) {   
                    var key = formItem.key;
                    var minimum = schemaItem.minItems;           
                    formItem['ngModel'] = function(ngModel){
                         ngModel.$validators[key] = function (value) {
                            if (value && value.length) {
                                return value.length >= minimum;
                            } else {
                                return false;
                            }
                        };
                    };
                },
                maxItems: function(formItem, schemaItem, form) {   
                    var key = formItem.key;
                    var maximum = schemaItem.minItems;           
                    formItem['ngModel'] = function(ngModel){
                         ngModel.$validators[key] = function (value) {
                            if (value && value.length) {
                                return value.length <= maximum;
                            } else {
                                return false;
                            }
                        };
                    };
                }
            };
            
            var name;
            var schemaItem;
            if (angular.isString(formItem)) {
                name = formItem;
                schemaItem = schema.properties[name];
            } else {
                if ('key' in formItem) {
                    name = formItem.key;
                    schemaItem = schema.properties[name];
                } else {
                    name = undefined
                    schemaItem = undefined
                }
 
                for (var key in formItem) {
                    if (key !== 'type' && key in formRules) {
                        var rule = formRules[key];
                        rule(formItem, schemaItem, form);
                    } else {
                        $log.debug('SchemaService: no rule know for key: ' + key);
                    }
                }
                for (var key in schemaItem) {
                    if (key !== 'type' && key in schemaRules) {
                        var schemarule = schemaRules[key];
                        schemarule(formItem, schemaItem, form);
                    } else {
                        $log.debug('SchemaService: no rule know for key: ' + key);
                    }
                }
                // Perform type handlers last so they can use the other values
                if ('type' in formItem) {
                    var typerule = formRules['type'];
                    typerule(formItem, schemaItem, form);
                }
            }

            if (angular.isDefined(schemaItem)) {
                schema.properties[name] = schemaItem;
            }
            form.push(formItem);
        }
    }
})();

(function() {
  'use strict';

  FormController.$inject = ["$scope", "$timeout", "$log", "SchemaService", "SubmitSimulationService"];
  angular
    .module('simCitySimDirective')
    .controller('FormController', FormController);

  function FormController($scope, $timeout, $log, SchemaService, SubmitSimulationService) {
    var vm = this;

    vm.schema = {};
    vm.form = [];
    vm.model = {};
    vm.hidden = true;
    vm.startFade = false;
    vm.message = '';

    // Functions the controller exposes
    vm.onSubmit = onSubmit;

    // Initialize controller
    try {
      vm.schemaurl = $scope.$parent.widget.data.schemaurl;
    } catch(e) {
      // Do nothing...
    }

    if(vm.schemaurl) {
      SchemaService.getSchema(vm.schemaurl).then(
        function(data) {
          vm.schema = data.schema;
          vm.form = data.form;
        }
      );
    } else {
      $log.debug('SimCityDirective.FormController: no URL provided');
    }
    
    // Add the model of this form to the schema service so it can be updated
    SchemaService.setFormModel(vm.model);

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
      } else {
          flashMessage('Form invalid! It has not been submitted!');
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

(function() {
  'use strict';

  runBlock.$inject = ["$log", "SchemaService"];
  angular
    .module('simCitySimDirective')
    .run(runBlock);

  /** @ngInject */
  function runBlock($log, SchemaService) {
    SchemaService.addCustomTypeHandler('point2d', function(formItem, schemaItem, form) {
       formItem['type'] = 'template'
       formItem['template'] = '<div>({{item.x}}, {{item.y}})</div>'
    });
  }

})();

/* global malarkey:false, moment:false */
(function() {
  'use strict';

  angular
    .module('simCitySimDirective')
    .constant('malarkey', malarkey)
    .constant('moment', moment);

})();

(function() {
  'use strict';

  config.$inject = ["$logProvider", "toastrConfig"];
  angular
    .module('simCitySimDirective')
    .config(config);

  /** @ngInject */
  function config($logProvider, toastrConfig) {
    // Enable log
    $logProvider.debugEnabled(true);

    // Set options third-party lib
    toastrConfig.allowHtml = true;
    toastrConfig.timeOut = 3000;
    toastrConfig.positionClass = 'toast-top-right';
    toastrConfig.preventDuplicates = true;
    toastrConfig.progressBar = true;
  }

})();

angular.module("simCitySimDirective").run(["$templateCache", function($templateCache) {$templateCache.put("app/components/sim-city/simform.directive.html","<div><div class=\"alert alert-success\" ng-hide=\"vm.hidden\" ng-class=\"{fade: vm.startFade}\">{{ vm.message }}</div><form name=\"myForm\" sf-schema=\"vm.schema\" sf-form=\"vm.form\" sf-model=\"vm.model\" sf-options=\"\"></form><button ng-click=\"vm.onSubmit(myForm)\" class=\"btn btn-success\">Submit</button></div>");}]);
//# sourceMappingURL=../maps/scripts/app.js.map
