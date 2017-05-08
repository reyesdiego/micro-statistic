/**
 * Created by diego on 04/05/17.
 */
"use strict";

var mongoose = require('mongoose');

var invoice = new mongoose.Schema({}, {strict: false});

module.exports = mongoose.model('invoices', invoice);
