angular.module('ssc', [
  'angular-loading-bar',
  'hc.marked',
  'leaflet-directive',
  'ngAnimate',
  'ngSanitize',
  'rx',
  'ui.bootstrap'
]);

angular.module('ssc').filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
});
