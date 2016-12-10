var _ = require('lodash'),
    Chance = require('chance'),
    debug = require('debug')('ssc:generator');
    geohash = require('ngeohash'),
    Point = require('./models/point'),
    Promise = require('bluebird');

var chance = new Chance();

module.exports = function() {

  var promise = Promise.resolve();

  if (process.env.SSC_CLEAR) {
    promise = promise.then(clearPoints);
  }

  return promise
    .then(countPoints)
    .then(generateMissingPoints)
    .then(done);
};

function clearPoints() {
  return Point.remove({});
}

function countPoints() {
  return Point.count();
}

function generateMissingPoints(count) {

  var n = parseInt(process.env.SSC_COUNT || '1000', 10) - count;
  if (n <= 0) {
    debug('Enough points (' + count + ') are already in the database; set $SSC_CLEAR to regenerate them');
    return [];
  }

  debug('Generating ' + n + ' random points');

  var points = [];

  _.times(n, function() {

    var latitude = chance.latitude(),
        longitude = chance.longitude();

    points.push(new Point({
      lat: latitude,
      lng: longitude,
      geohash: geohash.encode(latitude, longitude),
      geometry: {
        type: 'Point',
        coordinates: [ longitude, latitude ]
      }
    }));
  });

  return Promise.map(points, function(point) {
    return point.save();
  });
}

function done(points) {
  if (points.length) {
    debug('Done generating points');
  }
}
