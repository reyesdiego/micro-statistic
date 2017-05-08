/**
 * Created by diego on 15/03/17.
 */
"use strict";

module.exports = function () {
    var seneca = this;
    console.info("Init Statistic MongoDB");

    const config = require("../config/config.js")();

    require("./include/mongoose.js")(config.mongo.url, config.mongo.options);
    const Appointment = require('./appointment.js');
    const Invoice = require('./invoice.js');

    console.info("Adding Role: 'statistic'");

    seneca.add({role: "statistic", entity: "appointment", cmd: "getCountByMonth"}, (args, done) => {
        var appointment = new Appointment();
        appointment.getCountByMonth({fecha: args.fecha})
            .then( data => {
                done(null, data);
            })
            .catch(err => {
                done(err);
            });
    });

    seneca.add({role: "statistic", entity: "appointment", cmd: "getCountByHour"}, (args, done) => {
        var appointment = new Appointment();
        appointment.getCountByHour({fechaInicio: args.fechaInicio, fechaFin: args.fechaFin, fecha: args.fecha})
            .then( data => {
                done(null, data);
            })
            .catch(err => {
                done(err);
            });
    });

    seneca.add({role: "statistic", entity: "invoice", cmd: "getByRates"}, (args, done) => {
        var invoice = new Invoice();
        invoice.getByRates({fechaInicio: args.fechaInicio, fechaFin: args.fechaFin, rates: args.rates})
            .then( data => {
                done(null, data);
            })
            .catch(err => {
                done(err);
            });
    });


};