var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var PointSchema = new Schema({
  geohash: String,
  geometry: {
    type: { type: String, required: true },
    coordinates: { type: [Number], required: true }
  }
})

module.exports = mongoose.model('Point', PointSchema);
