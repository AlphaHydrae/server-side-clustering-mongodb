angular.module('ssc').component('controls', {
  templateUrl: '/templates/controls.html',
  controllerAs: 'controls',
  controller: function($http, Map, $scope) {

    var controls = this;

    controls.params = {
      algorithm: 'geohashing'
    };

    controls.requests = [];
    controls.requestsCount = 0;

    Map.onRequest(function(request) {
      if (request) {
        controls.requestsCount++;
        controls.requests.push(request);

        if (controls.requests.length > 10) {
          controls.requests.shift();
        }
      }
    });

    $scope.$watch('controls.params', function(params) {
      Map.updateParams(params);
    }, true);

    $http({
      method: 'HEAD',
      url: '/api/points'
    }).then(function(res) {
      controls.pointsCount = parseInt(res.headers('SSC-Points-Count'), 10);
    });
  }
});
