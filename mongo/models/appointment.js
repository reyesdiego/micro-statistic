/**
 * Created by Diego Reyes on 3/21/14.
 */
var mongoose = require('mongoose');

var appointment = new mongoose.Schema({}, {strict: false});

module.exports = mongoose.model('appointments', appointment);
