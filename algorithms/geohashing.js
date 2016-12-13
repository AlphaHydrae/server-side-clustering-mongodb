var _ = require('lodash'),
    geohash = require('ngeohash'),
    Point = require('../models/point');

module.exports = function(bbox) {

  // Aim to have a grid of at most 8x8 clusters.
  var maxClusters = 64;

  // Get the appropriate geohash length for the desired number of clusters.
  var geohashPrefixLength = getGeohashLength(bbox, maxClusters);

  // Get all geohash prefixes of that length within the bounding box.
  var geohashPrefixes = geohash.bboxes(bbox.minLat, bbox.minLng, bbox.maxLat, bbox.maxLng, geohashPrefixLength);

  var data = {
    bbox: bbox,
    geohashPrefixLength: geohashPrefixLength,
    geohashPrefixes: geohashPrefixes
  };

  // Run the aggregation query.
  return Promise
    .resolve(data)
    .then(aggregate)
    .return(data)
    .then(formatResult);
};

function aggregate(data) {
  return Point.aggregate([
    {
      $project: {
        lat: 1,
        lng: 1,
        // Get the geohash prefix for each point.
        geohashPrefix: {
          $substr: [ '$geohash', 0, data.geohashPrefixLength ]
        }
      }
    },
    {
      // Select only the points that have a geohash prefix among
      // the expected ones.
      $match: {
        geohashPrefix: { $in: data.geohashPrefixes }
      }
    },
    {
      // Ensure all resulting points are within the bounding box.
      $match: {
        lat: { $gte: data.bbox.minLat, $lte: data.bbox.maxLat },
        lng: { $gte: data.bbox.minLng, $lte: data.bbox.maxLng }
      }
    },
    {
      // Group the points by geohash prefix.
      $group: {
        _id: '$geohashPrefix',
        // Sum the number of points in that cluster.
        count: { $sum: 1 },
        // Compute the average latitude in that cluster.
        lat: { $avg: '$lat' },
        // Compute the average longitude in that cluster.
        lng: { $avg: '$lng' }
      }
    }
  ]).then(function(clusters) {
    data.clusters = clusters;
  });
}

function formatResult(data) {
  return _.pick(data, 'clusters', 'geohashPrefixLength');
}

function getGeohashLength(bbox, maxClusters) {

  // Get the total latitude difference from the left to the right
  // of the bounding box, and the total longitude.
  var latDiff = bbox.maxLat - bbox.minLat,
      lngDiff = bbox.maxLng - bbox.minLng;

  var numberOfClusters = 0,
      geohashLength = 0,
      latInterval = 180,
      lngInterval = 360;

  while (true) {

    geohashLength++;

    // For each additional geohash character, 2 and 3 bits of precision
    // are added to the latitude and longitude (alternatively). Knowing
    // this, we can predict the number of geohashes in the bounding box.
    if (geohashLength % 2 == 1) {
      latInterval = latInterval / Math.pow(2, 2);
      lngInterval = lngInterval / Math.pow(2, 3);
    } else {
      latInterval = latInterval / Math.pow(2, 3);
      lngInterval = lngInterval / Math.pow(2, 2);
    }

    var newNumberOfClusters = (latDiff / latInterval) * (lngDiff / lngInterval);
    if (newNumberOfClusters > maxClusters) {
      if (numberOfClusters <= 0) {
        return geohashLength;
      } else {
        return geohashLength - 1;
      }
    }

    numberOfClusters = newNumberOfClusters;
  };
}
