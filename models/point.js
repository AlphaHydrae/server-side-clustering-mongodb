var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Promise = require('bluebird');

var PointSchema = new Schema({
  lat: { type: Number, required: true, index: true },
  lng: { type: Number, required: true, index: true },
  geohash: { type: String, required: true, index: true },
  geometry: {
    type: { type: String, required: true, enum: [ 'Point' ] },
    coordinates: { type: [Number], required: true }
  },
  countryIsoCode: { type: String, index: true }
});

PointSchema.index({ geometry: '2dsphere' });

module.exports = mongoose.model('Point', PointSchema);
