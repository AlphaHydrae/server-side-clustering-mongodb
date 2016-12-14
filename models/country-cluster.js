var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Promise = require('bluebird');

var CountryClusterSchema = new Schema({
  name: { type: String, required: true },
  isoCode: { type: String, required: true, unique: true },
  area: { type: Number, required: true, min: 1 },
  center: {
    type: { type: String, required: true, enum: [ 'Point' ] },
    coordinates: { type: [Number], required: true }
  },
  geometry: {
    type: { type: String, required: true, enum: [ 'Polygon', 'MultiPolygon' ] },
    coordinates: { type: Schema.Types.Mixed, required: true }
  }
});

CountryClusterSchema.index({ center: '2dsphere', geometry: '2dsphere' });

module.exports = mongoose.model('CountryCluster', CountryClusterSchema);
