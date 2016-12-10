angular.module('mgh').component('controls', {
  templateUrl: '/templates/controls.html',
  controllerAs: 'controls',
  controller: function(Map, $scope) {

    var controls = this;

    controls.params = {
      algorithm: 'geohashing'
    };

    $scope.$watch('controls.params', function(params) {
      Map.updateParams(params);
    }, true);
  }
});
