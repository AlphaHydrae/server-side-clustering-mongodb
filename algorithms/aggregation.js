var _ = require('lodash'),
    Point = require('../models/point'),
    Promise = require('bluebird');

module.exports = function(bbox) {

  var latDiff = bbox.maxLat - bbox.minLat,
      lngDiff = bbox.maxLng - bbox.minLng;

  var latInterval = Math.round(latDiff / 7),
      lngInterval = Math.round(lngDiff / 7);

  var precision = 1 / Math.min(latInterval, lngInterval);

  return Promise
    .resolve([ bbox, precision ])
    .spread(aggregate)
    .then(function(clusters) {

      _.each(clusters, function(cluster) {
        cluster._id = '' + cluster._id.lat + ',' + cluster._id.lng;
      });

      return {
        precision: 0.1,
        clusters: clusters
      };
    });
};

function aggregate(bbox, precision) {
  return Point.aggregate([
    {
      $match: {
        lat: { $gte: bbox.minLat, $lte: bbox.maxLat },
        lng: { $gte: bbox.minLng, $lte: bbox.maxLng }
      }
    },
    {
      $project: {
        lat: 1,
        lng: 1,
        roundedLat: {
          $divide: [
            {
              $subtract: [
                {
                  $multiply: [ '$lat', precision ]
                },
                {
                  $mod: [
                    {
                      $multiply: [ '$lat', precision ]
                    },
                    1
                  ]
                }
              ]
            },
            precision
          ]
        },
        roundedLng: {
          $divide: [
            {
              $subtract: [
                {
                  $multiply: [ '$lng', precision ]
                },
                {
                  $mod: [
                    {
                      $multiply: [ '$lng', precision ]
                    },
                    1
                  ]
                }
              ]
            },
            precision
          ]
        }
      }
    },
    {
      $group: {
        _id: {
          lat: '$roundedLat',
          lng: '$roundedLng'
        },
        count: { $sum: 1 },
        lat: { $avg: '$lat' },
        lng: { $avg: '$lng' }
      }
    }
  ]).exec();
}
