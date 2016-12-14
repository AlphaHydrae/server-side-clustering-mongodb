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
  controller: function($http, leafletData, $location, $log, Map, $scope, $timeout) {

    var leafletMap,
        mapParams,
        currentPrecision,
        mapCtrl = this;

    mapCtrl.config = {
      center: {},
      markers: []
    };

    setCenterFromAddress();

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

    function setCenterFromAddress() {

      var params = $location.search();

      var lat = parseFloat(params.lat),
          lng = parseFloat(params.lng),
          zoom = parseInt(params.zoom, 10);

      if (_.isFinite(lat) && _.isFinite(lng) && _.isFinite(zoom)) {
        _.extend(mapCtrl.config.center, {
          lat: lat,
          lng: lng,
          zoom: zoom
        });
      } else {
        _.extend(mapCtrl.config.center, {
          lat: 51.505,
          lng: -0.09,
          zoom: 3
        });
      }
    }

    function updateClusters() {
      if (!leafletMap || !mapParams) {
        return;
      }

      $location.search('lat', _.round(leafletMap.getCenter().lat, 5));
      $location.search('lng', _.round(leafletMap.getCenter().lng, 5));
      $location.search('zoom', leafletMap.getZoom());

      fetchClusters().then(updateMap);
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

      $log.debug('Found ' + data.clusters.length + ' clusters matching bbox');

      removeMarkers(data);

      // Wait for leaflet to remove the markers before adding new ones,
      // otherwise it loses its mind.
      $timeout(function() {
        _.each(data.clusters, addClusterMarker);
      }, 1);
    }

    function removeMarkers(data) {
      var clusters = data.clusters;
      mapCtrl.config.markers = _.filter(mapCtrl.config.markers, function(marker) {
        return leafletMap.getBounds().contains([ marker.lat, marker.lng ]) && !!_.find(clusters, { _id: marker._id });
      });
    }

    function addClusterMarker(cluster) {

      var markerData = _.pick(cluster, '_id', 'lat', 'lng', 'count');

      var marker = _.find(mapCtrl.config.markers, {
        _id: cluster._id
      });

      if (marker) {
        _.extend(marker, markerData);
      } else {
        marker = markerData;
        mapCtrl.config.markers.push(marker);
      }

      if (cluster.count >= 2) {
        marker.icon = createClusterIcon(cluster);
      } else {
        delete marker.icon;
      }
    }

    function createClusterIcon(cluster) {

      var clusterIcon = $('<div class="cluster-icon" />');
      var value = $('<strong />').text(cluster.count).appendTo(clusterIcon);

      return {
        type: 'div',
        html: clusterIcon[0].outerHTML,
        iconSize: [ 40, 40 ],
        iconAnchor: [ 20, 20 ]
      };
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
