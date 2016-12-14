angular.module('ssc', [
  'angular-loading-bar',
  'leaflet-directive',
  'ngAnimate',
  'rx',
  'ui.bootstrap'
]);

angular.module('ssc').config(function($logProvider) {
  $logProvider.debugEnabled(false);
});

angular.module('ssc').filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
});
