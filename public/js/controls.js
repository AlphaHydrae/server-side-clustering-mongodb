angular.module('ssc').component('controls', {
  templateUrl: '/templates/controls.html',
  controllerAs: 'controls',
  controller: function($http, $location, Map, $scope) {

    var controls = this;

    var algorithms = [ 'geohashing', 'aggregation', 'countries' ];

    controls.params = {};

    setAlgorithm($location.search().algorithm);

    controls.requests = [];
    controls.requestsCount = 0;

    Map.onRequest(function(request) {
      if (request) {
        controls.requestsCount++;
        controls.requests.push(request);

        if (controls.requests.length > 100) {
          controls.requests.shift();
        }
      }
    });

    $scope.$watch('controls.params', function(params) {
      Map.updateParams(params);
    }, true);

    $scope.$watch('controls.params.algorithm', function(algorithm, oldAlgorithm) {
      if (algorithm !== oldAlgorithm && oldAlgorithm) {
        $location.search('algorithm', algorithm);
      }
    });

    $scope.$on('$locationChangeSuccess', function() {
      setAlgorithm($location.search().algorithm);
    });

    $http({
      method: 'HEAD',
      url: '/api/points'
    }).then(function(res) {
      controls.pointsCount = parseInt(res.headers('SSC-Points-Count'), 10);
    });

    function setAlgorithm(algorithm) {
      controls.params.algorithm = _.includes(algorithms, algorithm) ? algorithm : algorithms[0];
    }
  }
});
