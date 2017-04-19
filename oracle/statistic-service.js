/**
 * Created by diego on 13/03/17.
 */
"use strict";

const config = require("../config/config.js")();

var seneca = require("seneca")();

seneca.use("./statistic-interface.js");

seneca.listen(config.PORT, config.HOST, (err, data) => {
    console.info('Micro Service Statistic Oracle');
    console.info(` HOST: ${data.host} \n PORT: ${data.port}`);
});
