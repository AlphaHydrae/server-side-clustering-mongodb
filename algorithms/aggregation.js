var _ = require('lodash'),
    Point = require('../models/point'),
    Promise = require('bluebird');

module.exports = function(bbox) {

  // Aim to have a grid of about 8x8 clusters.
  var maxClusters = 64,
      sqrtMaxClusters = Math.sqrt(maxClusters);

  // Get the total latitude difference from the left to the right
  // of the bounding box, and the total longitude.
  var latDiff = bbox.maxLat - bbox.minLat,
      lngDiff = bbox.maxLng - bbox.minLng;

  // Calculate the latitude and longitude intervals needed to obtain
  // about 8x8 clusters, e.g. if the latitude difference is 32, then
  // the interval should be 4.
  var latInterval = latDiff / sqrtMaxClusters,
      lngInterval = lngDiff / sqrtMaxClusters;

  var data = {
    bbox: bbox,
    latInterval: latInterval,
    lngInterval: lngInterval
  };

  // Run the aggregation query.
  return Promise
    .resolve(data)
    .then(aggregate)
    .return(data)
    .then(formatResult);
};

function aggregate(data) {

  var bbox = data.bbox;

  // Calculate the numbers used to round the latitude and longitude
  // to the target intervals.
  //
  // If the desired interval is 0.01, the factor used will be 100.
  // Latitudes will be multiplied by 100, truncated and divided by 100,
  // resulting in a 0.01 interval.
  var latFactor = 1 / data.latInterval,
      lngFactor = 1 / data.lngInterval;

  // Use the MongoDB aggregation pipeline.
  return Point.aggregate([
    {
      // Select only the points that are within the bounding box.
      $match: {
        lat: { $gte: bbox.minLat, $lte: bbox.maxLat },
        lng: { $gte: bbox.minLng, $lte: bbox.maxLng }
      }
    },
    {
      $project: {
        lat: 1,
        lng: 1,
        // Add the latitude rounded to the target interval.
        roundedLat: {
          $divide: [
            {
              $subtract: [
                { $multiply: [ '$lat', latFactor ] },
                {
                  $mod: [
                    { $multiply: [ '$lat', latFactor ] },
                    1
                  ]
                }
              ]
            },
            latFactor
          ]
        },
        // Add the longitude rounded to the target interval.
        roundedLng: {
          $divide: [
            {
              $subtract: [
                { $multiply: [ '$lng', lngFactor ] },
                {
                  $mod: [
                    { $multiply: [ '$lng', lngFactor ] },
                    1
                  ]
                }
              ]
            },
            lngFactor
          ]
        }
      }
    },
    {
      // Group the points by rounded latitude and longitude.
      $group: {
        _id: {
          lat: '$roundedLat',
          lng: '$roundedLng'
        },
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

  _.each(data.clusters, function(cluster) {
    cluster._id = '' + cluster._id.lat + ',' + cluster._id.lng;
  });

  return _.pick(data, 'clusters', 'latInterval', 'lngInterval');
}
