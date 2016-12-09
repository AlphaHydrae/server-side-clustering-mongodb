var express = require('express'),
    Point = require('../models/point'),
    router = express.Router();

router.get('/points', function(req, res, next) {
  Point.find().exec().then(function(points) {
    res.json(points);
  }).catch(next);
});

router.get('/*', function(req, res) {
  res.sendStatus(404);
});

module.exports = router;
