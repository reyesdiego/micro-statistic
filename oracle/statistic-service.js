/**
 * Created by diego on 13/03/17.
 */
"use strict";

const config = require("../config/config.js");

var seneca = require("seneca")();

seneca.use("./statistic-interface.js");

seneca.listen({port:config.PORT, host: config.HOST, timeout: 100000}, (err, data) => {
    console.info('Micro Service Statistic Oracle');
    console.info(` HOST: ${data.host} \n PORT: ${data.port}`);
});
