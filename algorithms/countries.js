var _ = require('lodash'),
    CountryCluster = require('../models/country-cluster'),
    Point = require('../models/point'),
    Promise = require('bluebird');

module.exports = function(bbox) {

  var data = {
    bbox: bbox
  };

  return Promise
    .resolve(data)
    .then(findClusters)
    .return(data)
    .then(aggregate)
    .return(data)
    .then(formatResult);
};

function aggregate(data) {
  if (!data.countryClusters.length) {
    return;
  }

  return Point.aggregate([
    {
      $match: {
        countryIsoCode: {
          $in: _.map(data.countryClusters, 'isoCode')
        }
      }
    },
    {
      $project: {
        lat: 1,
        lng: 1,
        countryIsoCode: 1
      }
    },
    {
      $group: {
        // Group the points by country.
        _id: '$countryIsoCode',
        // Sum the number of points in that cluster.
        count: { $sum: 1 },
        // Compute the average latitude in that cluster.
        lat: { $avg: '$lat' },
        // Compute the average longitude in that cluster.
        lng: { $avg: '$lng' }
      }
    }
  ]).exec().then(function(clusters) {
    data.clusters = clusters;
  });
}

function formatResult(data) {
  return {
    clusters: data.clusters || []
  };
}

function findClusters(data) {

  var bbox = data.bbox;
  var bboxPolygon = {
    type: 'Polygon',
    coordinates: [[[bbox.minLng, bbox.minLat], [bbox.maxLng, bbox.minLat], [bbox.maxLng, bbox.maxLat], [bbox.minLng, bbox.maxLat], [bbox.minLng, bbox.minLat]]]
  };

  return CountryCluster.find({
    $or: [
      {
        geometry: {
          $geoWithin: {
            $geometry: bboxPolygon
          }
        }
      },
      {
        geometry: {
          $geoIntersects: {
            $geometry: bboxPolygon
          }
        }
      }
    ]
  }).then(function(countryClusters) {
    data.countryClusters = countryClusters;
  });
}
