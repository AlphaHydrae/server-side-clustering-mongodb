angular.module('ssc', [
  'angular-loading-bar',
  'leaflet-directive',
  'ngAnimate',
  'rx',
  'ui.bootstrap'
]);

angular.module('ssc').filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
});
