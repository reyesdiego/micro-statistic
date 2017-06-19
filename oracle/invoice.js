/**
 * Created by diego on 13/03/17.
 */
"use strict";

function getResultSet (connection, resultSet, numRows) {
    return new Promise((resolve, reject) => {
        var ret = [];
        fetchRowsFromRS(connection, resultSet, numRows, ret, (err, ret) => {
            if (err) {
                reject(err);
            } else {
                resolve(ret);
            }
        });
    });
}

function fetchRowsFromRS(connection, resultSet, numRows, ret, callback) {
    resultSet.getRows(numRows, (err, rows) => {
        if (err) {
            callback(err);
        } else if (rows.length === 0) {    // no rows, or no more rows
            callback(undefined, ret);
        } else if (rows.length > 0) {
            rows.map(item => {
                ret.push(item);
            });
            fetchRowsFromRS(connection, resultSet, numRows, ret, callback);
        }
    });
}

class Invoice {
    constructor (oracle) {
        this.cn = oracle;
    }

    getCodes (params) {
        return new Promise((resolve, reject) => {
            var strlSql = `SELECT CODE, SUM(IMP_TOT) TOTAL, SUM(CNT) CANTIDAD
                        FROM INVOICE_DETAIL D
                            INNER JOIN INVOICE_HEADER H ON H.ID = D.INVOICE_HEADER_ID
                        WHERE TERMINAL = :1 AND
                              FECHA_EMISION >= TO_DATE(:2, 'YYYY-MM-DD')
                        GROUP BY D.CODE`;

            this.cn.simpleExecute(strlSql, [params.terminal, params.fecha])
                .then(data => {
                    resolve({
                        status: "OK",
                        data: data.rows
                    });
                })
                .catch(err => {
                    reject({
                        status: "ERROR",
                        message: err.message,
                        data: err
                    });
                });
        });
    }

    getByRates (params) {
        return new Promise((resolve, reject) => {
            var moment = require("moment");
            var Enumerable = require("linq");
            var fechaInicio,
                fechaFin,
                rates = '';

            if (params.fechaInicio !== undefined) {
                fechaInicio = moment(params.fechaInicio, ['YYYY-MM-DD']).format('YYYY-MM-DD');
            }
            if (params.fechaInicio !== undefined) {
                fechaFin = moment(params.fechaFin, ['YYYY-MM-DD']).format('YYYY-MM-DD');
            }
            if (params.rates !== undefined) {
                params.rates.forEach(item => {
                    rates += `'${item}',`;
                });
                rates = rates.substr(0, rates.length-1);
            }

            var strSql = `SELECT VHD.TERMINAL, T.CODE, SUM(IMP_TOT) as TOTAL
                            FROM V_INVOICE_HEADER_DETAIL VHD
                                INNER JOIN TARIFARIO_TERMINAL TT ON TT.TERMINAL = VHD.TERMINAL AND TT.CODE = VHD.CODE
                                INNER JOIN TARIFARIO T ON T.ID = TT.TARIFARIO_ID
                            WHERE FECHA_EMISION >= TO_DATE(:1,'YYYY-MM-DD') AND
                                   FECHA_EMISION <= TO_DATE(:2,'YYYY-MM-DD') AND
                                   T.CODE IN (${rates})
                            GROUP BY VHD.TERMINAL, T.CODE`;

            this.cn.simpleExecute(strSql, [fechaInicio, fechaFin])
                .then(data => {

                    let result = Enumerable.from(data.rows).groupBy("{code: $.CODE, terminal: $.TERMINAL}", null,
                        (key, g) => {
                            var result = {
                                terminal: key.terminal
                            };
                            result[key.code] = g.sum("$.TOTAL");
                            return result;
                        }).toArray();

                    let result2 = Enumerable.from(result).groupBy("$.terminal" , null,
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

                    resolve({
                        status: "OK",
                        data: result2
                    });
                })
                .catch(err => {
                    reject({
                        status: "ERROR",
                        message: err.message,
                        data: err
                    });
                });
        });
    }

    getByRatesPivot (params) {
        return new Promise((resolve, reject) => {
            var moment = require("moment");
            var fechaInicio,
                fechaFin,
                rates = '';

            if (params.fechaInicio !== undefined) {
                fechaInicio = moment(params.fechaInicio, ['YYYY-MM-DD']).format('YYYY-MM-DD');
            }
            if (params.fechaInicio !== undefined) {
                fechaFin = moment(params.fechaFin, ['YYYY-MM-DD']).format('YYYY-MM-DD');
            }
            if (params.rates !== undefined) {
                params.rates.forEach(item => {
                    rates += `'${item}',`;
                });
                rates = rates.substr(0, rates.length-1);
            }

            var strSql = '';

            if (rates !== '') {
                strSql = `SELECT TO_CHAR(VHD.FECHA_EMISION, 'YYYY') AS ANIO, TO_CHAR(VHD.FECHA_EMISION, 'MM') AS MES, VHD.TERMINAL, T.CODE, VHD.ISO1 LARGO, VHD.ISO3 ISO3_ID, ISO3.NAME ISO3_NAME, SUM(IMP_TOT * v.type) as TOTAL, COUNT(DISTINCT CONTENEDOR) AS CNT
                    FROM V_INVOICE_HEADER_DETAIL VHD
                        INNER JOIN VOUCHER_TYPE V ON V.ID = VHD.COD_TIPO_COMPROB
                        LEFT JOIN ISO3 ON VHD.ISO3 = ISO3.ID
                        INNER JOIN TARIFARIO_TERMINAL TT ON TT.TERMINAL = VHD.TERMINAL AND TT.CODE = VHD.CODE
                        INNER JOIN TARIFARIO T ON T.ID = TT.TARIFARIO_ID
                    WHERE FECHA_EMISION >= TO_DATE(:1,'YYYY-MM-DD') AND
                           FECHA_EMISION <= TO_DATE(:2,'YYYY-MM-DD') AND
                           T.CODE IN (${rates})
                    GROUP BY TO_CHAR(VHD.FECHA_EMISION, 'YYYY'), TO_CHAR(VHD.FECHA_EMISION, 'MM'), VHD.TERMINAL, T.CODE, VHD.ISO1, VHD.ISO3, ISO3.NAME`;
            } else {
                strSql = `SELECT TO_CHAR(VHD.FECHA_EMISION, 'YYYY') AS ANIO, TO_CHAR(VHD.FECHA_EMISION, 'MM') AS MES, VHD.TERMINAL, VHD.ISO1 LARGO, VHD.ID ISO3_ID, ISO3.NAME ISO3_NAME, SUM(IMP_TOT * v.type) as TOTAL, COUNT(DISTINCT CONTENEDOR) AS CNT
                    FROM V_INVOICE_HEADER_DETAIL VHD
                        INNER JOIN VOUCHER_TYPE V ON V.ID = VHD.COD_TIPO_COMPROB
                        LEFT JOIN ISO3 ON VHD.ISO3 = ISO3.ID
                    WHERE FECHA_EMISION >= TO_DATE(:1,'YYYY-MM-DD') AND
                           FECHA_EMISION <= TO_DATE(:2,'YYYY-MM-DD')
                    GROUP BY TO_CHAR(VHD.FECHA_EMISION, 'YYYY'), TO_CHAR(VHD.FECHA_EMISION, 'MM'), VHD.TERMINAL, VHD.ISO1, VHD.ID, ISO3.NAME`;
            }

            var self = this;
            this.cn.getConnection()
            .then(connection => {
                    this.cn.execute(strSql, [fechaInicio, fechaFin], {outFormat: this.cn.OBJECT, resultSet: true}, connection)
                        .then(data => {

                            let resultSet = data.resultSet;
                            getResultSet(connection, data.resultSet, 500)
                                .then(data => {
                                    resultSet.close(err=> {
                                        self.cn.releaseConnection(connection);
                                    });
                                    let result = data.map(item => ({
                                        anio: item.ANIO,
                                        mes: item.MES,
                                        terminal: item.TERMINAL,
                                        code: item.CODE,
                                        largo: (item.LARGO === null) ? 'NC' : item.LARGO,
                                        iso3Id: item.ISO3_ID,
                                        iso3Name: item.ISO3_NAME,
                                        total: item.TOTAL,
                                        cantidad: item.CNT
                                    }));
                                    resolve({
                                        status: "OK",
                                        data: result
                                    });
                                })
                                .catch(err => {
                                    self.cn.releaseConnection(connection);
                                    reject({status: "ERROR", message: err.message, data: err});
                                });
                        })
                        .catch(err => {
                            self.cn.releaseConnection(connection);
                            reject({
                                status: "ERROR",
                                message: err.message,
                                data: err
                            });
                        });
                });
        });
    }

    getCountsByDate (params) {
        return new Promise((resolve, reject) => {
            var moment = require("moment");

            var fechaEmision = moment().format('YYYY-MM-DD');

            if (params.fecha !== undefined) {
                fechaEmision = moment(params.fecha, ['YYYY-MM-DD']).format('YYYY-MM-DD');
            }
            var date5Ago = moment(fechaEmision).subtract(4, 'days').format('YYYY-MM-DD');
            var tomorrow = moment(fechaEmision).add(1, 'days').format('YYYY-MM-DD');

            var strSql = `SELECT terminal,
                         FECHA_EMISION,
                         sum(total) as total,
                         count(*) as cnt
                         FROM INVOICE_HEADER
                         WHERE FECHA_EMISION < TO_DATE(:1,'YYYY-MM-DD') AND
                               FECHA_EMISION >= TO_DATE(:2,'YYYY-MM-DD')
                        GROUP BY terminal, FECHA_EMISION
                        ORDER BY FECHA_EMISION, TERMINAL`;

            this.cn.simpleExecute(strSql, [tomorrow, date5Ago])
                .then(data => {
                    var response = data.rows.map(item => {
                        return {
                            cnt: (item.CNT === null) ? 0 : item.CNT,
                            total: (item.TOTAL === null) ? 0 : item.TOTAL,
                            terminal: item.TERMINAL,
                            date: item.FECHA_EMISION
                        };
                    });
                    resolve({
                        status: "OK",
                        data: response
                    });
                })
                .catch(err => {
                    reject({
                        status: "ERROR",
                        message: err.message,
                        data: err
                    });
                });
        });
    }

    getCountByMonth (params) {
        return new Promise((resolve, reject) => {
            var moment = require("moment");

            var fechaEmision = moment(moment().format('YYYY-MM-DD')).subtract(moment().date() - 1, 'days').format('YYYY-MM-DD');

            if (params.fecha !== undefined) {
                fechaEmision = moment(params.fecha, ['YYYY-MM-DD']).format('YYYY-MM-DD');
            }
            var month5Ago = moment(fechaEmision).subtract(4, 'months').format('YYYY-MM-DD');
            var nextMonth = moment(fechaEmision).add(1, 'months').format('YYYY-MM-DD');

            var strSql = `SELECT terminal, TO_NUMBER(TO_CHAR(fecha_emision, 'YYYY')) YEAR,
                                 TO_NUMBER(TO_CHAR(fecha_emision, 'MM')) MONTH,
                                 TO_NUMBER(TO_CHAR(fecha_emision, 'YYYYMM')) DIA,
                                 sum(total) as total, count(*) as cnt
                          FROM INVOICE_HEADER
                          WHERE FECHA_EMISION < TO_DATE(:1,'YYYY-MM-DD') AND
                                 FECHA_EMISION >= TO_DATE(:2,'YYYY-MM-DD')
                          GROUP BY terminal,TO_NUMBER(TO_CHAR(fecha_emision, 'YYYY')),
                                 TO_NUMBER(TO_CHAR(fecha_emision, 'MM')),
                                 TO_NUMBER(TO_CHAR(fecha_emision, 'YYYYMM'))
                          ORDER BY DIA, TERMINAL`;

            this.cn.simpleExecute(strSql, [nextMonth, month5Ago])
                .then(data => {
                    var response = data.rows.map(item => ({
                            terminal: item.TERMINAL,
                            year: item.YEAR,
                            month: item.MONTH,
                            dia: item.DIA,
                            cnt: item.CNT,
                            total: item.TOTAL
                    }));
                    resolve({
                        status: "OK",
                        data: response
                    });
                })
                .catch(err => {
                    reject({
                        status: "ERROR",
                        message: err.message,
                        data: err
                    });
                });

        });
    }
}

module.exports = Invoice;