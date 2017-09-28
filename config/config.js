/**
 * Created by diego on 13/03/17.
 */
"use strict";

var config;

/** Validaciones */
if (process.env.NODE_ENV === undefined || process.env.NODE_ENV === '') {
    console.error("Variable de entorno NODE_ENV no definida o inválida. El proceso se abortará");
    process.exit(1);
}

if (isNaN(process.env.PORT)) {
    console.error("Variable de entorno PORT no definida o inválida. El proceso se abortará");
    process.exit(1);
}

if (process.env.HOST === undefined || process.env.HOST === '') {
    console.error("Variable de entorno HOST no definida o inválida. El proceso se abortará");
    process.exit(1);
}
/** Fin Validaciones */

if (process.env.NODE_ENV === 'development') {
    config = require('./config-dev.json');
} else {
    config = require('./config-pro.json');
}

config.PORT = process.env.PORT;
config.HOST = process.env.HOST;

config.NODE_ENV = process.env.NODE_ENV;


module.exports = config;