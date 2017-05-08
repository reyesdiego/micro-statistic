/**
 * Created by diego on 13/03/17.
 */
"use strict";

module.exports = function () {
    var seneca = this;
    console.info("Init Statistic Oracle");

    var Invoice = require('./invoice.js');
    var Gate = require('./gate.js');

    var oracle = require('./include/oracledbWrap');
    oracle.createPool({
        user          : "afip",
        password      : "AFIP_",
        connectString : "(DESCRIPTION = " +
        "(ADDRESS = (PROTOCOL = TCP)(HOST = 10.1.0.60)(PORT = 1521)) " +
        "(CONNECT_DATA = " +
        "        (SID = AFIP) " +
        ") " +
        ")"
    }).then(function (pool) {
        console.info("Adding Role: 'statistic'");

        seneca.add({role: "statistic", entity: "invoice", cmd: "getCodes"}, (args, done) => {
            const invoice = new Invoice(oracle);
            invoice.getCodes({terminal: args.terminal, fecha: args.fecha})
                .then( data => {
                    done(null, data);
                })
            .catch(err => {
                    done(err);
                });
        });

        seneca.add({role: "statistic", entity: "invoice", cmd: "getCountsByDate"}, (args, done) => {
            const invoice = new Invoice(oracle);
            invoice.getCountsByDate({fecha: args.fecha})
                .then( data => {
                    done(null, data);
                })
                .catch(err => {
                    done(err);
                });
        });

        seneca.add({role: "statistic", entity: "invoice", cmd: "getCountByMonth"}, (args, done) => {
            const invoice = new Invoice(oracle);
            invoice.getCountByMonth({fecha: args.fecha})
                .then( data => {
                    done(null, data);
                })
                .catch(err => {
                    done(err);
                });
        });

        seneca.add({role: "statistic", entity: "invoice", cmd: "getByRates"}, (args, done) => {
            var invoice = new Invoice(oracle);
            invoice.getByRates({fechaInicio: args.fechaInicio, fechaFin: args.fechaFin, rates: args.rates})
                .then( data => {
                    done(null, data);
                })
                .catch(err => {
                    done(err);
                });
        });

        seneca.add({role: "statistic", entity: "invoice", cmd: "getByRatesPivot"}, (args, done) => {
            var invoice = new Invoice(oracle);
            invoice.getByRatesPivot({fechaInicio: args.fechaInicio, fechaFin: args.fechaFin, rates: args.rates})
                .then( data => {
                    done(null, data);
                })
                .catch(err => {
                    done(err);
                });
        });

        seneca.add({role: "statistic", entity: "gate", cmd: "getCountByMonth"}, (args, done) => {
            const gate = new Gate(oracle);
            gate.getCountByMonth({fechaInicio: args.fechaInicio, fechaFin: args.fechaFin})
                .then( data => {
                    done(null, data);
                })
                .catch(err => {
                    done(err);
                });
        });

        seneca.add({role: "statistic", entity: "gate", cmd: "getCountByHour"}, (args, done) => {
            const gate = new Gate(oracle);
            gate.getCountByHour({fechaInicio: args.fechaInicio, fechaFin: args.fechaFin})
                .then( data => {
                    done(null, data);
                })
                .catch(err => {
                    done(err);
                });
        });

    });

};