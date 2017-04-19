/**
 * Created by diego on 13/03/17.
 */
"use strict";

class Gate {
    constructor (oracle) {
        this.cn = oracle;
    }

/*    getCodes (params) {
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
    }*/
    getCountByHour (params) {
        return new Promise((resolve, reject) => {

            var strSql = `select terminal, to_number(to_char(gatetimestamp, 'HH24')) hora,  count(*) cnt
                          from gates
                          where gatetimestamp >= TO_DATE(:1, 'yyyy-mm-dd') AND
                          gatetimestamp < TO_DATE(:2, 'yyyy-mm-dd')
                          group by terminal, to_char(gatetimestamp, 'HH24')`;

            this.cn.simpleExecute(strSql, [params.fechaInicio, params.fechaFin])
                .then(data => {
                    var response = data.rows.map(item => ({
                        terminal: item.TERMINAL,
                        hour: item.HORA,
                        cnt: item.CNT
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

    getCountByMonth (params) {
        return new Promise((resolve, reject) => {
            var moment = require("moment");

            var inicio = moment(params.fechaInicio).format("YYYY-MM-DD");
            var fin = moment(params.fechaFin).format("YYYY-MM-DD");

            var strSql = "select terminal, to_number(to_char(gatetimestamp, 'YYYY')) year, to_number(to_char(gatetimestamp, 'MM')) mes,  to_number(to_char(gatetimestamp, 'YYYYMM')) DIA, count(*) cnt " +
                "from gates " +
                "where gatetimestamp >= TO_DATE(:1, 'yyyy-mm-dd') AND " +
                "gatetimestamp < TO_DATE(:2, 'yyyy-mm-dd') " +
                "group by terminal, to_char(gatetimestamp, 'YYYY'), to_char(gatetimestamp, 'MM'), to_char(gatetimestamp, 'YYYYMM') " +
                "ORDER BY DIA, TERMINAL";

            this.cn.simpleExecute(strSql, [inicio, fin])
                .then(data => {
                    var response = data.rows.map(item => ({
                            terminal: item.TERMINAL,
                            year: item.YEAR,
                            month: item.MES,
                            cnt: item.CNT
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

module.exports = Gate;