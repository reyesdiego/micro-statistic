/**
 * Created by diego on 13/03/17.
 */
"use strict";

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