/**
 * Created by diego on 04/05/17.
 */
"use strict";

class Invoice {
    constructor(oracle) {
        this.model = require('./models/invoice.js');
        this.matchPrice = require('./models/matchprice.js');
    }

    getByRates (params) {
        return new Promise((resolve, reject) => {
            var param,
                dateIni,
                dateFin;
            var moment = require("moment");
            var Enumerable = require("linq");

            if (params.rates.length >=1) {

                dateIni = moment(params.fechaInicio, 'YYYY-MM-DD').toDate();
                dateFin = moment(params.fechaFin, 'YYYY-MM-DD').toDate();

                param = [
                    { $match: { code: {$in: params.rates } } },
                    { $unwind: '$match'},
                    { $project : {code: '$code',  match: '$match', _id: false}}
                ];
                this.matchPrice.aggregate(param, (err, matchprices) => {
                    var ids =[];
                    matchprices.forEach(item => {
                        ids.push(item.match);
                    });

                    param = [
                        {
                            $match : { 'fecha.emision': { $gte: dateIni, $lte: dateFin }  }
                        },
                        {
                            $unwind : '$detalle'
                        },
                        {
                            $unwind : '$detalle.items'
                        },
                        {
                            $match : {
                                'detalle.items.id' : {$in: ids }
                            }
                        },
                        {
                            $group  : {
                                _id: { terminal: '$terminal', code: '$detalle.items.id'},
                                total: { $sum : '$detalle.items.impTot'}
                            }
                        },
                        {
                            $project : { _id:0, terminal: '$_id.terminal', code: '$_id.code', total:1}
                        }
                    ];

                    var rates = this.model.aggregate(param);
                    rates.exec( (err, ratesData) => {
                        var response,
                            result,
                            result2;

                        if (err) {
                            reject({status:"ERROR", data: err.message});
                        }
                        else {
                            response = Enumerable.from(ratesData)
                                .join(Enumerable.from(matchprices), '$.code', '$.match', (rate, matchprice) => {
                                    rate.code = matchprice.code;
                                    return rate;
                                }).toArray();
                            result = Enumerable.from(response).groupBy("{code: $.code, terminal: $.terminal}", null,
                                (key, g) => {
                                    var result = {
                                        terminal: key.terminal
                                    };
                                    result[key.code] = g.sum("$.total");
                                    return result;
                                }).toArray();

                            result2 = Enumerable.from(result).groupBy("$.terminal" , null,
                                (key, g) => {
                                    var prop = g.getSource();
                                    var ter = {terminal: key, data: {}};
                                    prop.forEach(item => {
                                        for (var pro in item){
                                            if (pro !== 'terminal') {
                                                ter.data[pro] = item[pro];
                                            }
                                        }
                                    });
                                    return (ter);
                                }).toArray();

                            resolve({status:'OK', data: result2});
                        }
                    });
                });
            } else {
                resolve({status:"OK", data: null});
            }
        });
    }
}

module.exports = Invoice;