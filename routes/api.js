var _ = require('lodash'),
    express = require('express'),
    Point = require('../models/point'),
    Promise = require('bluebird'),
    router = express.Router();

var algorithms = {
  aggregation: require('../algorithms/aggregation'),
  geohashing: require('../algorithms/geohashing')
};

router.get('/points', function(req, res, next) {
  Promise
    .resolve()
    .then(fetchPoints)
    .then(_.bind(res.json, res))
    .catch(next);
});

router.get('/clusters', function(req, res, next) {
  Promise
    .resolve([ req.query.type, req.query.bbox ])
    .spread(computeClusters)
    .then(_.bind(res.json, res))
    .catch(next);
});

router.get('/*', function(req, res) {
  res.sendStatus(404);
});

router.use(function(err, req, res, next) {
  res.status(500).send(err.stack);
});

module.exports = router;

function fetchPoints() {
  return Point.find().exec();
}

function computeClusters(type, bboxString) {

  var coordinates = _.map(bboxString.split(','), parseFloat);

  var bbox = {
    minLat: coordinates[1],
    maxLat: coordinates[3],
    minLng: coordinates[0],
    maxLng: coordinates[2]
  };

  var algorithm = algorithms[type];
  if (algorithm) {
    return algorithm(bbox);
  } else {
    throw new Error('Unknown cluster type "' + type + '"');
  }
}
