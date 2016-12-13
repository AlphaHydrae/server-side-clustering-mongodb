angular.module('ssc').factory('Map', function(rx) {

  var paramsSubject = new rx.BehaviorSubject(),
      requestSubject = new rx.BehaviorSubject();

  return {
    updateParams: function(params) {
      paramsSubject.onNext(params);
    },
    onParamsUpdated: function(callback) {
      paramsSubject.subscribe(callback);
    },
    notifyRequest: function(request) {
      requestSubject.onNext(request);
    },
    onRequest: function(callback) {
      requestSubject.subscribe(callback);
    }
  };
})

angular.module('ssc').component('map', {
  templateUrl: '/templates/map.html',
  controllerAs: 'mapCtrl',
  controller: function($http, leafletData, $log, Map, $scope) {

    var leafletMap,
        mapParams,
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

    $scope.$on('leafletDirectiveMap.map.moveend', updateClusters);
    $scope.$on('leafletDirectiveMarker.map.click', zoomToMarker);

    Map.onParamsUpdated(function(params) {
      mapParams = params;
      updateClusters();
    });

    function updateClusters() {
      if (!leafletMap || !mapParams) {
        return;
      }

      Promise
        .resolve()
        .then(fetchClusters)
        .then(updateMap)
        .then(_.bind($scope.$apply, $scope));
    }

    function fetchClusters() {

      var algorithm = mapParams.algorithm,
          bounds = leafletMap.getBounds(),
          start = new Date().getTime();

      return $http({
        url: '/api/clusters',
        params: {
          type: algorithm,
          bbox: bounds.toBBoxString()
        }
      }).then(function(res) {

        Map.notifyRequest({
          algorithm: algorithm,
          bounds: bounds,
          time: new Date().getTime() - start,
          algorithmTime: parseInt(res.headers('SSC-Algorithm-Time'), 10),
          response: res
        });

        return res.data;
      });
    }

    function updateMap(data) {

      $log.debug('Found ' + data.clusters.length + ' clusters at precision ' + data.precision + ' matching bbox');

      return Promise
        .resolve(data)
        .then(removeMarkers)
        .return(data.clusters)
        .each(addClusterMarker);
    }

    function removeMarkers(data) {

      var clusters = data.clusters,
          precision = data.precision;

      if (precision != currentPrecision) {
        mapCtrl.config.markers.length = 0;
        currentPrecision = precision;
      } else {
        mapCtrl.config.markers = _.filter(mapCtrl.config.markers, function(marker) {
          return leafletMap.getBounds().contains([ marker.lat, marker.lng ]) && _.find(clusters, { _id: marker._id });
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
