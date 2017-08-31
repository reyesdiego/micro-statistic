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
                //strSql = `SELECT TO_CHAR(VHD.FECHA_EMISION, 'YYYY') AS ANIO, TO_CHAR(VHD.FECHA_EMISION, 'MM') AS MES, VHD.TERMINAL, VHD.TIPO, T.CODE, VHD.ISO1 LARGO, VHD.ISO3 ISO3_ID, ISO3.NAME ISO3_NAME, SUM(IMP_TOT * v.type) as TOTAL, COUNT(DISTINCT CONTENEDOR) AS CNT
                //    FROM V_INVOICE_HEADER_DETAIL VHD
                //        INNER JOIN VOUCHER_TYPE V ON V.ID = VHD.COD_TIPO_COMPROB
                //        LEFT JOIN ISO3 ON VHD.ISO3 = ISO3.ID
                //        INNER JOIN TARIFARIO_TERMINAL TT ON TT.TERMINAL = VHD.TERMINAL AND TT.CODE = VHD.CODE
                //        INNER JOIN TARIFARIO T ON T.ID = TT.TARIFARIO_ID
                //    WHERE vhd.terminal = 'BACTSSA' AND NRO_COMPROB = 61977 AND
                //            FECHA_EMISION >= TO_DATE(:1,'YYYY-MM-DD') AND
                //           FECHA_EMISION <= TO_DATE(:2,'YYYY-MM-DD') AND
                //           LENGTH(CONTENEDOR) = 11 AND
                //           T.CODE IN (${rates})
                //    GROUP BY TO_CHAR(VHD.FECHA_EMISION, 'YYYY'), TO_CHAR(VHD.FECHA_EMISION, 'MM'), VHD.TERMINAL, VHD.TIPO, T.CODE, VHD.ISO1, VHD.ISO3, ISO3.NAME`;

//                strSql = `SELECT contenedor, TO_CHAR(VHD.FECHA_EMISION, 'YYYY') AS ANIO, TO_CHAR(VHD.FECHA_EMISION, 'MM') AS MES, VHD.TERMINAL, VHD.TIPO AS MOV, T.CODE, iso1 AS LARGO, ISO3.TIPO, SUM(IMP_TOT * v.type) as TOTAL
//FROM V_INVOICE_HEADER_DETAIL VHD
//    INNER JOIN VOUCHER_TYPE V ON V.ID = VHD.COD_TIPO_COMPROB
//    LEFT JOIN ISO3 ON VHD.ISO3 = ISO3.ID
//WHERE COD_MONEDA <> 'PES' AND
//      FECHA_EMISION >= TO_DATE(:1,'YYYY-MM-DD') AND
//      FECHA_EMISION <= TO_DATE(:2,'YYYY-MM-DD') AND
//      LENGTH(CONTENEDOR) = 11 AND
//      T.CODE IN (${rates})
//group by VHD.CONTENEDOR, TO_CHAR(VHD.FECHA_EMISION, 'YYYY'), TO_CHAR(VHD.FECHA_EMISION, 'MM'), VHD.TERMINAL, VHD.TIPO, TH.ID, iso1, ISO3.TIPO`;
//
                strSql = `
SELECT contenedor, TO_CHAR(VHD.FECHA_EMISION, 'YYYY') AS ANIO, TO_CHAR(VHD.FECHA_EMISION, 'MM') AS MES, VHD.TERMINAL, VHD.TIPO AS MOV, TH.ID, iso1 AS LARGO, ISO3.TIPO, SUM(IMP_TOT * v.type) as TOTAL
FROM V_INVOICE_HEADER_DETAIL VHD
    INNER JOIN VOUCHER_TYPE V ON V.ID = VHD.COD_TIPO_COMPROB
    LEFT JOIN ISO3 ON VHD.ISO3 = ISO3.ID
    INNER JOIN TARIFARIO_TERMINAL TT ON TT.TERMINAL = VHD.TERMINAL AND TT.CODE = VHD.CODE
    INNER JOIN TARIFARIO T ON T.ID = TT.TARIFARIO_ID
    INNER JOIN TARIFARIO_GROUP TG ON T.ID = TG.TARIFARIO_ID
    INNER JOIN TARIFARIO_HEADER TH ON TG.TARIFARIO_HEADER_ID = TH.ID
WHERE COD_MONEDA = 'DOL' AND
      FECHA_EMISION >= TO_DATE(:1,'YYYY-MM-DD') AND
      FECHA_EMISION <= TO_DATE(:2,'YYYY-MM-DD') /*AND
      LENGTH(CONTENEDOR) = 11 */AND
      TH.ID IN (${rates})
group by VHD.CONTENEDOR, TO_CHAR(VHD.FECHA_EMISION, 'YYYY'), TO_CHAR(VHD.FECHA_EMISION, 'MM'), VHD.TERMINAL, VHD.TIPO, TH.ID, iso1, ISO3.TIPO`;


           } else {
                /*
                strSql = `SELECT TO_CHAR(VHD.FECHA_EMISION, 'YYYY') AS ANIO, TO_CHAR(VHD.FECHA_EMISION, 'MM') AS MES, VHD.TERMINAL, VHD.TIPO, VHD.ISO1 LARGO, VHD.ISO3 ISO3_ID, ISO3.NAME ISO3_NAME, SUM(IMP_TOT * v.type) as TOTAL, COUNT(DISTINCT CONTENEDOR) AS CNT
                    FROM V_INVOICE_HEADER_DETAIL VHD
                        INNER JOIN VOUCHER_TYPE V ON V.ID = VHD.COD_TIPO_COMPROB
                        LEFT JOIN ISO3 ON VHD.ISO3 = ISO3.ID
                    WHERE vhd.terminal = 'BACTSSA' AND NRO_COMPROB = 61977 and
                    FECHA_EMISION >= TO_DATE(:1,'YYYY-MM-DD') AND
                           FECHA_EMISION <= TO_DATE(:2,'YYYY-MM-DD') AND
                           LENGTH(CONTENEDOR) = 11
                    GROUP BY TO_CHAR(VHD.FECHA_EMISION, 'YYYY'), TO_CHAR(VHD.FECHA_EMISION, 'MM'), VHD.TERMINAL, VHD.TIPO, VHD.ISO1, VHD.ISO3, ISO3.NAME`;
                */
                strSql = `SELECT contenedor, TO_CHAR(VHD.FECHA_EMISION, 'YYYY') AS ANIO, TO_CHAR(VHD.FECHA_EMISION, 'MM') AS MES, VHD.TERMINAL, VHD.TIPO AS MOV, iso1 AS LARGO, ISO3.TIPO, SUM(IMP_TOT * v.type) as TOTAL
FROM V_INVOICE_HEADER_DETAIL VHD
    INNER JOIN VOUCHER_TYPE V ON V.ID = VHD.COD_TIPO_COMPROB
    LEFT JOIN ISO3 ON VHD.ISO3 = ISO3.ID
WHERE COD_MONEDA <> 'PES' AND
    FECHA_EMISION >= TO_DATE(:1,'YYYY-MM-DD') AND
    FECHA_EMISION <= TO_DATE(:2,'YYYY-MM-DD') AND
    LENGTH(CONTENEDOR) = 11
group by VHD.CONTENEDOR, TO_CHAR(VHD.FECHA_EMISION, 'YYYY'), TO_CHAR(VHD.FECHA_EMISION, 'MM'), VHD.TERMINAL, VHD.TIPO, iso1, ISO3.TIPO`;


            //    ( (vhd.terminal = 'BACTSSA' AND NRO_COMPROB in (42618, 61977) and nro_pto_venta in (25, 29) )
            //    or
            //    (vhd.terminal = 'TRP' AND NRO_COMPROB in (41952) and nro_pto_venta in (55) )
            //) and

            }

            var self = this;
            this.cn.getConnection()
            .then(connection => {
                    this.cn.execute(strSql, [fechaInicio, fechaFin], {outFormat: this.cn.OBJECT, resultSet: true}, connection)
                    //this.cn.execute(strSql, [], {outFormat: this.cn.OBJECT, resultSet: true}, connection)
                        .then(data => {
                            let resultSet = data.resultSet;
                            getResultSet(connection, data.resultSet, 500)
                                .then(data => {

                                    resultSet.close( err => {
                                        self.cn.releaseConnection(connection);
                                    });
                                    let result = data.map(item => ({
                                        anio: item.ANIO,
                                        mes: item.MES,
                                        terminal: item.TERMINAL,
                                        tipo: (item.TIPO === null) ? 'Sin Informar' : item.TIPO,
                                        mov: (item.MOV === null) ? 'Sin Informar' : item.MOV,
                                        code: item.ID,
                                        largo: (item.LARGO === null) ? 'Sin Informar' : (item.LARGO * 10).toString() + " Pies",
                                        iso3Id: item.TIPO,
                                        iso3Name: item.TIPO,
                                        total: item.TOTAL
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

    getByGroupsPivot (params) {

        return new Promise((resolve, reject) => {
            var moment = require("moment");
            var fechaInicio,
                fechaFin,
                groups = '';

            if (params.fechaInicio !== undefined) {
                fechaInicio = moment(params.fechaInicio, ['YYYY-MM-DD']).format('YYYY-MM-DD');
            }
            if (params.fechaInicio !== undefined) {
                fechaFin = moment(params.fechaFin, ['YYYY-MM-DD']).format('YYYY-MM-DD');
            }

            if (params.groups !== undefined && params.groups.length > 0) {
                params.groups.forEach(item => {
                    groups += `'${item}',`;
                });
                groups = groups.substr(0, groups.length-1);
            }

            var strSql = '';
            if (groups !== '') {
                strSql = `SELECT contenedor, TO_CHAR(VHD.FECHA_EMISION, 'YYYY') AS ANIO, TO_CHAR(VHD.FECHA_EMISION, 'MM') AS MES, VHD.TERMINAL, VHD.TIPO AS MOV, iso1 AS LARGO, iso2.tipo as altura, ISO3F.NAME AS FORMA, SUM(IMP_TOT * v.type) as TOTAL
                            FROM V_INVOICE_HEADER_DETAIL VHD
                                INNER JOIN VOUCHER_TYPE V ON V.ID = VHD.COD_TIPO_COMPROB
                                LEFT JOIN ISO2 ON VHD.ISO2 = ISO2.ID
                                LEFT JOIN ISO3 ON VHD.ISO3 = ISO3.ID
                                LEFT JOIN ISO3_FORMA ISO3F ON ISO3F.ID = ISO3.FORMA
                            WHERE COD_MONEDA = 'DOL' AND
                                  FECHA_EMISION >= TO_DATE(:1,'YYYY-MM-DD') AND
                                  FECHA_EMISION <= TO_DATE(:2,'YYYY-MM-DD') AND
                                  LENGTH(CONTENEDOR) = 11 AND
                                  VHD.ID IN ( SELECT VHD.ID
                                              FROM V_INVOICE_HEADER_DETAIL VHD
                                              WHERE VHD.ID IN ( SELECT VHD.ID
                                                              FROM TARIFARIO_TERMINAL TT
                                                                  INNER JOIN TARIFARIO_GROUP TG ON TT.TARIFARIO_ID = TG.TARIFARIO_ID
                                                              WHERE VHD.TERMINAL = TT.TERMINAL AND
                                                                    TT.CODE = VHD.CODE AND
                                                                    TG.TARIFARIO_HEADER_ID IN (${groups})  )
                                             GROUP BY VHD.ID )
                            GROUP BY VHD.CONTENEDOR, TO_CHAR(VHD.FECHA_EMISION, 'YYYY'), TO_CHAR(VHD.FECHA_EMISION, 'MM'), VHD.TERMINAL, VHD.TIPO, iso1, iso2.tipo, ISO3F.NAME`;

            } else {
                strSql = `SELECT contenedor, TO_CHAR(VHD.FECHA_EMISION, 'YYYY') AS ANIO, TO_CHAR(VHD.FECHA_EMISION, 'MM') AS MES, VHD.TERMINAL, VHD.TIPO AS MOV, iso1 AS LARGO, iso2.tipo as altura, ISO3F.NAME AS FORMA, SUM(IMP_TOT * v.type) as TOTAL
                            FROM V_INVOICE_HEADER_DETAIL VHD
                                INNER JOIN VOUCHER_TYPE V ON V.ID = VHD.COD_TIPO_COMPROB
                                LEFT JOIN ISO2 ON VHD.ISO2 = ISO2.ID
                                LEFT JOIN ISO3 ON VHD.ISO3 = ISO3.ID
                                LEFT JOIN ISO3_FORMA ISO3F ON ISO3F.ID = ISO3.FORMA
                            WHERE COD_MONEDA = 'DOL' AND
                                  FECHA_EMISION >= TO_DATE(:1,'YYYY-MM-DD') AND
                                  FECHA_EMISION <= TO_DATE(:2,'YYYY-MM-DD') AND
                                  LENGTH(CONTENEDOR) = 11
                            GROUP BY VHD.CONTENEDOR, TO_CHAR(VHD.FECHA_EMISION, 'YYYY'), TO_CHAR(VHD.FECHA_EMISION, 'MM'), VHD.TERMINAL, VHD.TIPO, iso1, iso2.tipo, ISO3F.NAME`;
            }

            var self = this;
            this.cn.getConnection()
                .then(connection => {
                    this.cn.execute(strSql, [fechaInicio, fechaFin], {outFormat: this.cn.OBJECT, resultSet: true}, connection)
                        //this.cn.execute(strSql, [], {outFormat: this.cn.OBJECT, resultSet: true}, connection)
                        .then(data => {
                            let resultSet = data.resultSet;
                            getResultSet(connection, data.resultSet, 500)
                                .then(data => {

                                    resultSet.close( err => {
                                        self.cn.releaseConnection(connection);
                                    });
                                    let result = data.map(item => ({
                                        anio: item.ANIO,
                                        mes: item.MES,
                                        terminal: item.TERMINAL,
                                        tipo: (item.FORMA === null) ? 'Sin Informar' : item.FORMA,
                                        mov: (item.MOV === null) ? 'Sin Informar' : item.MOV,
                                        largo: (item.LARGO === null) ? 'Sin Informar' : (item.LARGO * 10).toString() + " Pies",
                                        iso2Id: (item.ALTURA === null) ? 'Sin Informar' : item.ALTURA,
                                        iso3Id: item.ID,
                                        total: item.TOTAL,
                                        contenedor: item.CONTENEDOR
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
                            console.info("SHIT catch")
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