var _ = require('lodash'),
    Chance = require('chance'),
    CountryCluster = require('./models/country-cluster'),
    db = require('./db'),
    debug = require('debug')('ssc:generator');
    geohash = require('ngeohash'),
    geojsonArea = require('@mapbox/geojson-area'),
    gju = require('geojson-utils'),
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
    promise = promise.then(clearData);
  }

  return promise
    .return(data)
    .then(countPoints)
    .return(data)
    .then(generateMissingPoints)
    .return(data)
    .then(done);
};

function clearData() {
  return Promise.all([
    Point.remove({}),
    CountryCluster.remove({})
  ]);
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
  }

  return Promise
    .resolve(data)
    .then(generateCountryClusters)
    .return(data)
    .then(generatePoints);
}

function generateCountryClusters(data) {

  var countries = require('./data/countries.geo').features,
      countryCodes = _.map(countries, 'id');

  return CountryCluster.find({
    isoCode: {
      $in: countryCodes
    }
  }).then(function(countryClusters) {

    var promises = [];

    var missingCountries = _.filter(countries, function(country) {
      return !_.find(countryClusters, { isoCode: country.id });
    });

    if (missingCountries.length) {
      debug('Generating ' + missingCountries.length + ' new country clusters');
    } else {
      debug('All ' + missingCountries.length + ' country clusters have already been generated; set $SSC_CLEAR to regenerate them');
    }

    db.log = false;

    _.each(missingCountries, function(country) {

      var countryCluster = new CountryCluster({
        name: country.properties.name,
        isoCode: country.id,
        geometry: country.geometry,
        area: geojsonArea.geometry(country.geometry),
        center: gju.centroid(country.geometry)
      });

      if (countryCluster.isoCode.match(/^[A-Z]{3}$/) && _.isFinite(countryCluster.center.coordinates[0])) {
        promises.push(countryCluster.save());
      }
    });

    return Promise.all(promises).then(function() {
      db.log = true;
      debug('Generated ' + promises.length + ' country clusters');
    });
  });
}

function generatePoints(data) {
  if (data.generatedCount === 0) {
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
      geometry: {
        type: 'Point',
        coordinates: [ longitude, latitude ]
      }
    });

    // When creating a point, pre-compute the geohash for its coordinates
    // (using the ngeohash library).
    point.geohash = geohash.encode(latitude, longitude);

    points.push(point);
  });

  return Promise.map(points, function(point) {
    return findPointCountryCluster(point).then(function(countryCluster) {
      if (countryCluster) {
        point.countryIsoCode = countryCluster.isoCode;
      }

      return point.save();
    });
  }).then(function() {

    data.generatedCount += n;
    debug('Generated ' + data.generatedCount + '/' + (data.targetCount - data.count) + ' points');

    if (data.count + data.generatedCount < data.targetCount) {
      return generatePoints(data);
    }
  });
}

function findPointCountryCluster(point) {
  return CountryCluster.findOne({
    geometry: {
      $geoIntersects: {
        $geometry: point.geometry
      }
    }
  });
}

function done(data) {

  db.log = true;

  if (data.generatedCount) {
    debug('Done generating points');
  }
}
