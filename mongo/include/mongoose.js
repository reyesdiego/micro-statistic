/**
 * Created by diego on 7/3/15.
 */
module.exports = function (url, options) {
    'use strict';
    var mongoose = require('mongoose');

    if (options) {
        mongoose.connect(url, options);
    } else {
        mongoose.connect(url);
    }

    mongoose.connection.on('connected', function () {
        console.info("Mongoose %s Connected to Database. %s", mongoose.version, url);
        global.mongoose.connected = true;
    });

    mongoose.connection.on('error', function (err) {
        console.error("Database or Mongoose error. %s", err.stack);
    });
    mongoose.connection.on('disconnected', function () {
        console.error("Mongoose default connection disconnected, el proceso %s se abortará", process.pid);
        process.exit(1);
    });

    global.mongoose = {
        connected: false,
        version: mongoose.version
    };

    process.on('SIGINT', function () {
        mongoose.connection.close(function () {
            console.info("Mongoose default connection disconnected through app termination");
            process.exit(1);
        });
    });
};

