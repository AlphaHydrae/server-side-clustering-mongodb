angular.module('mgh', [
  'leaflet-directive'
]);

angular.module('mgh').component('map', {
  template: '<leaflet lf-center="mapCtrl.config.center" markers="mapCtrl.config.markers"></leaflet>',
  controllerAs: 'mapCtrl',
  controller: function($http) {

    var mapCtrl = this;

    mapCtrl.config = {
      center: {
        lat: 51.505,
        lng: -0.09,
        zoom: 3
      },
      markers: []
    };

    $http({
      url: '/api/points'
    }).then(function(res) {
      _.each(res.data, function(point) {
        mapCtrl.config.markers.push({
          lat: point.geometry.coordinates[1],
          lng: point.geometry.coordinates[0]
        })
      });

      console.log(mapCtrl.config.markers);
    });
  }
});
