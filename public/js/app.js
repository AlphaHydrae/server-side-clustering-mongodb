angular.module('mgh', [
  'leaflet-directive'
]);

angular.module('mgh').component('map', {
  template: '<leaflet lf-center="mapCtrl.center"></leaflet>',
  controllerAs: 'mapCtrl',
  controller: function() {

    var mapCtrl = this;

    mapCtrl.center = {
      lat: 51.505,
      lng: -0.09,
      zoom: 8
    };
  }
});
