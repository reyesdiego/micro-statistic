/**
 * Created by diego on 04/05/17.
 */
"use strict";

var mongoose = require('mongoose');

var matchprice = new mongoose.Schema({}, {strict: false});

module.exports = mongoose.model('matchprices', matchprice);
