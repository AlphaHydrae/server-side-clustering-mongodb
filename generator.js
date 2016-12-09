var _ = require('lodash'),
    Chance = require('chance'),
    debug = require('debug')('ssc:generator');
    Point = require('./models/point'),
    Promise = require('bluebird');

var chance = new Chance();

module.exports = function() {

  var n = 1000;
  debug('Generating ' + n + ' random points');

  var points = [];

  _.times(n, function() {
    points.push(new Point({
      geometry: {
        type: 'Point',
        coordinates: [ chance.longitude(), chance.latitude() ]
      }
    }));
  });

  return Point.remove({}).then(function() {
    return Promise.map(points, function(point) {
      return point.save();
    }).then(function() {
      debug('Generated points');
    });
  });
};
