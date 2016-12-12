var _ = require('lodash'),
    debug = require('debug')('ssc:db'),
    mongoose = require('mongoose'),
    Promise = require('bluebird');

exports.log = true;

mongoose.Promise = Promise;
mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost/server-side-clustering');

mongoose.set('debug', function(col, method, query, doc, options) {
  if (!exports.log) {
    return;
  }

  var message = 'db.' + col + '.' + method + '(' + JSON.stringify(query);
  if (doc && !_.isEmpty(doc)) {
    message += ', ' + JSON.stringify(doc);
  }

  message += ')';

  if (options && !_.isEmpty(options)) {
    message += ' with options ' + JSON.stringify(options);
  }

  debug(message);
});
