var _ = require('lodash'),
    express = require('express'),
    Point = require('../models/point'),
    Promise = require('bluebird'),
    router = express.Router();

var algorithms = {
  aggregation: require('../algorithms/aggregation'),
  geohashing: require('../algorithms/geohashing')
};

router.head('/points', function(req, res, next) {
  Promise
    .resolve()
    .then(countPoints)
    .then(function(count) {
      res.set('SSC-Points-Count', count);
      res.send();
    })
    .catch(next);
});

router.get('/clusters', function(req, res, next) {
  Promise
    .resolve([ req.query.type, req.query.bbox, res ])
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

function countPoints() {
  return Point.count().exec();
}

function computeClusters(type, bboxString, res) {

  var start = new Date().getTime();

  var coordinates = _.map(bboxString.split(','), parseFloat);

  var bbox = {
    minLat: coordinates[1],
    maxLat: coordinates[3],
    minLng: coordinates[0],
    maxLng: coordinates[2]
  };

  var algorithm = algorithms[type];
  if (algorithm) {
    return algorithm(bbox).then(setResponseHeaders);
  } else {
    throw new Error('Unknown cluster type "' + type + '"');
  }

  function setResponseHeaders(data) {
    res.set('SSC-Algorithm-Time', '' + (new Date().getTime() - start));
    return data;
  }
}
