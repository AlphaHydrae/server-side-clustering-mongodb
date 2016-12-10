var Point = require('../models/point');

module.exports = function(bbox) {

  var prefixData = getGeohashClusterPrefixes(bbox);

  return Point.aggregate([
    {
      $project: {
        lat: 1,
        lng: 1,
        prefix: {
          $substr: [ '$geohash', 0, prefixData.precision ]
        }
      }
    },
    {
      $match: {
        lat: { $gte: bbox.minLat, $lte: bbox.maxLat },
        lng: { $gte: bbox.minLng, $lte: bbox.maxLng },
        prefix: { $in: prefixData.prefixes }
      }
    },
    {
      $group: {
        _id: '$prefix',
        count: {
          $sum: 1
        },
        lat: { $avg: '$lat' },
        lng: { $avg: '$lng' }
      }
    }
  ]).exec().then(function(clusters) {
    return {
      clusters: clusters,
      precision: prefixData.precision
    };
  });
};

function getGeohashClusterPrefixes(bbox, previousPrefixes, precision) {

  precision = precision || 1;
  previousPrefixes = previousPrefixes || [];

  var nextPrefixes = geohash.bboxes(bbox.minLat, bbox.minLng, bbox.maxLat, bbox.maxLng, precision);
  if (nextPrefixes.length > 100 && previousPrefixes.length > 0) {
    return {
      precision: precision - 1,
      prefixes: previousPrefixes
    };
  } else if (nextPrefixes.length <= 0) {
    return {
      precision: precision,
      prefixes: nextPrefixes
    };
  } else {
    return getGeohashClusterPrefixes(bbox, nextPrefixes, precision + 1);
  }
}
