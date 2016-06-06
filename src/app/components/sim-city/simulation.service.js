(function() {
  'use strict';

  angular
    .module('simCitySimDirective')
    .service('SimulationService', SimulationService);

  function SimulationService($http, $q) {
    var service = {
      submit: submitTask,
      delete: deleteTask,
      startJob: startJob,
      list: viewTasks,
      get: getTask,
      summary: overview,
      simulationNames: simulationNames,
      simulationVersions: simulationVersions
    };
    return service;

    function viewTasks(baseUrl, simulation, version) {
      return $http.get(baseUrl + '/view/simulations/' + simulation + '/' + version);
    }

    function getTask(baseUrl, id) {
      return $http.get(baseUrl + '/simulation/' + id);
    }

    function startJob(baseUrl, host) {
      return $http.post(host ? baseUrl + '/job/' + host : baseUrl + '/job')
        .then(null, function(response) {
          if (response.status === 503) {
            response.message = 'Already enough jobs running'
            return $q.reject({message: 'Already enough jobs running', response: response});
          } else {
            return $q.reject(formatHTTPError(response.data, response.status, response.statusText,
                             'error starting job'));
          }
        });
    }

    function simulationNames(baseUrl) {
      return $http.get(baseUrl + '/simulate/')
        .then(function(response) {
          return response.data;
        });
    }

    function simulationVersions(baseUrl, model) {
      return $http.get(baseUrl + '/simulate/' + model)
        .then(function(response) {
          return Object.keys(response.data);
        });
    }

    function submitTask(baseUrl, model, version, params) {
      var url = baseUrl + '/simulate/' + model;
      if (version) {
        url += '/' + version;
      }
      return http('POST', url, params)
        .then(function(result) {
          var task = {url: result.headers('Location')};
          task.name = task.url.substr(task.url.lastIndexOf('/') + 1);
          return task;
        }, function(response) {
          var detailedMessage = formatHTTPError(response.data, response.status, response.statusText, 'error starting simulation');
          var message = 'Cannot add \'' + params.name + '\'';
          if (status === 400 && response.data && response.data.error) {
            message += ': ' + response.data.error;
          } else if (status === 500){
            message += ': internal server error';
          } else if (status === 502){
            message += ': cannot reach database';
          }
          return $q.reject(message, detailedMessage);
        });
    }

    function deleteTask(baseUrl, id, rev) {
      return http('DELETE', baseUrl + '/simulation/' + id, {rev: rev});
    }


    function overview(baseUrl) {
      return $http.get(baseUrl + '/view/totals')
        .then(function(response) {
          return {
            tasks: [
              {name: 'queued',     value: response.data.todo},
              {name: 'processing', value: response.data.locked},
              {name: 'done',       value: response.data.done},
              {name: 'with error', value: response.data.error}
            ],
            jobs: [
              {name: 'active',     value: response.data.active_jobs},
              {name: 'pending',    value: response.data.pending_jobs},
              {name: 'finished',   value: response.data.finished_jobs}
            ]
          };
        }, function(response) {
          var status;
          if (response.status === 0) {
            status = '';
          } else {
            status = '(code ' + response.status + ')';
          }
          return $q.reject('Cannot load infrastructure overview ' + status);
        });
    }

    function http(method, url, params) {
      return $http({
        method: method,
        url: url,
        params: params,
        headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'}
      });
    }
  }

  function formatHTTPError(data, status, statusText, defaultMsg) {
    var msg = data.error || defaultMsg;
    var httpStatusMsg = '(HTTP status ' + status + ': ' + statusText + ')';

    return {
      message: msg,
      httpStatusMessage: httpStatusMsg,
      formatted: msg + ' ' + httpStatusMsg
    };
  }
})();
