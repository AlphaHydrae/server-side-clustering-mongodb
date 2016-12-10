var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Promise = require('bluebird');

var PointSchema = new Schema({
  lat: { type: Number, required: true, index: true },
  lng: { type: Number, required: true, index: true },
  geohash: { type: String, required: true },
  geometry: {
    type: { type: String, required: true, index: true },
    coordinates: { type: [Number], required: true, index: { type: '2dsphere', sparse: true  } }
  }
});

module.exports = mongoose.model('Point', PointSchema);
