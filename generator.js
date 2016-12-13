var _ = require('lodash'),
    Chance = require('chance'),
    db = require('./db'),
    debug = require('debug')('ssc:generator');
    geohash = require('ngeohash'),
    Point = require('./models/point'),
    Promise = require('bluebird');

var chance = new Chance();

module.exports = function() {

  var data = {
    generatedCount: 0,
    targetCount: parseInt(process.env.SSC_COUNT || '1000', 10)
  };

  var promise = Promise.resolve(data);

  if (process.env.SSC_CLEAR) {
    promise = promise.then(clearPoints);
  }

  return promise
    .return(data)
    .then(countPoints)
    .return(data)
    .then(generateMissingPoints)
    .return(data)
    .then(done);
};

function clearPoints() {
  return Point.remove({});
}

function countPoints(data) {
  return Point.count().then(function(count) {
    data.count = count;
  });
}

function generateMissingPoints(data) {

  if (data.generatedCount === 0 && data.count >= data.targetCount) {
    debug('Enough points (' + data.count + ') are already in the database; set $SSC_CLEAR to regenerate them');
    return;
  } else if (data.generatedCount === 0) {
    debug('Generating ' + (data.targetCount - data.count) + ' random points');
  }

  var n = Math.min(data.targetCount - data.count - data.generatedCount, 1000);

  var points = [];

  db.log = false;

  _.times(n, function() {

    var latitude = chance.latitude(),
        longitude = chance.longitude();

    var point = new Point({
      lat: latitude,
      lng: longitude,
      // When creating a point, pre-compute the geohash for its coordinates
      // (using the ngeohash library).
      geohash: geohash.encode(latitude, longitude),
      geometry: {
        type: 'Point',
        coordinates: [ longitude, latitude ]
      }
    });

    points.push(point);
  });

  return Promise.map(points, function(point) {
    return point.save();
  }).then(function() {

    data.generatedCount += n;
    debug('Generated ' + data.generatedCount + '/' + (data.targetCount - data.count) + ' points');

    if (data.count + data.generatedCount < data.targetCount) {
      return generateMissingPoints(data);
    }
  });
}

function done(data) {

  db.log = true;

  if (data.generatedCount) {
    debug('Done generating points');
  }
}
