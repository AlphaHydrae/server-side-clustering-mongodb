var _ = require('lodash'),
    express = require('express'),
    fs = require('fs'),
    path = require('path'),
    router = express.Router();

var templateNames = _.map(fs.readdirSync(path.join(__dirname, '..', 'views', 'templates')), function(file) {
  return file.replace(/\.pug/, '');
});

router.get('/templates/:name.html', function(req, res) {

  var templateName = req.params.name.replace(/\.html$/, '');
  if (!_.includes(templateNames, templateName)) {
    return res.sendStatus(404);
  }

  res.render('templates/' + templateName);
});

router.get('/', function(req, res) {
  res.render('index');
});

module.exports = router;
