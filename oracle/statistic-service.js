/**
 * Created by diego on 13/03/17.
 */
"use strict";

const config = require("../config/config.js")();

var seneca = require("seneca")({timeout: 60000});

seneca.use("./statistic-interface.js");

seneca.listen(config.PORT, config.HOST, (err, data) => {
    console.info('Micro Service Statistic Oracle');
    console.info(` HOST: ${data.host} \n PORT: ${data.port}`);
});
