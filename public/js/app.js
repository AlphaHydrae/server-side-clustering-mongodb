angular.module('mgh', [
  'leaflet-directive'
]);

angular.module('mgh').component('map', {
  template: '<leaflet if="map" lf-center="mapCtrl.config.center" markers="mapCtrl.config.markers"></leaflet>',
  controllerAs: 'mapCtrl',
  controller: function($http, leafletData, $log, $scope) {

    var leafletMap,
        currentPrecision,
        mapCtrl = this;

    mapCtrl.config = {
      center: {
        lat: 51.505,
        lng: -0.09,
        zoom: 3
      },
      markers: []
    };

    leafletData.getMap('map').then(function(map) {
      leafletMap = map;
      updateClusters();
    });

    $scope.$on('leafletDirectiveMap.moveend', updateClusters);
    $scope.$on('leafletDirectiveMarker.click', zoomToMarker);

    function updateClusters() {
      if (!leafletMap) {
        return;
      }

      Promise
        .resolve()
        .then(fetchClusters)
        .get('data')
        .then(updateMap)
        .then(_.bind($scope.$apply, $scope));
    }

    function fetchClusters() {
      return $http({
        url: '/api/clusters',
        params: {
          type: 'geohashing',
          bbox: leafletMap.getBounds().toBBoxString()
        }
      });
    }

    function updateMap(data) {

      $log.debug('Found ' + data.clusters.length + ' clusters at precision ' + data.precision + ' matching bbox');

      return Promise
        .resolve(data.precision)
        .then(removeMarkers)
        .return(data.clusters)
        .each(addClusterMarker);
    }

    function removeMarkers(precision) {
      if (precision != currentPrecision) {
        mapCtrl.config.markers.length = 0;
        currentPrecision = precision;
      } else {
        mapCtrl.config.markers = _.filter(mapCtrl.config.markers, function(marker) {
          return leafletMap.getBounds().contains([ marker.lat, marker.lng ]);
        });
      }
    }

    function addClusterMarker(cluster) {

      var clusterData = _.pick(cluster, '_id', 'lat', 'lng', 'minLat', 'minLng', 'maxLat', 'maxLng');

      var existingMarker = _.find(mapCtrl.config.markers, {
        _id: clusterData._id
      });

      if (existingMarker) {
        _.extend(existingMarker, clusterData);
        return;
      }

      var clusterIcon = $('<div class="cluster-icon" />');
      var value = $('<strong />').text(cluster.count).appendTo(clusterIcon);

      var marker = _.extend(clusterData, {
        icon: {
          type: 'div',
          html: clusterIcon[0].outerHTML,
          iconSize: [ 40, 40 ],
          iconAnchor: [ 20, 20 ]
        }
      });

      mapCtrl.config.markers.push(marker);
    }

    function zoomToMarker(event, marker) {

      var zoom = leafletMap.getZoom();
      if (zoom < leafletMap.getMaxZoom()) {
        zoom += 1;
      }

      leafletMap.setView([ marker.model.lat, marker.model.lng ], zoom);
    }
  }
});
