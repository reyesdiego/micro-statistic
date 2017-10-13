/**
 * Created by diego on 13/03/17.
 */
"use strict";

class Gate {
    constructor (oracle) {
        this.cn = oracle;
    }

    getCountByDay (params) {
        return new Promise((resolve, reject) => {

            var strSql = `SELECT TERMINAL, TO_NUMBER(TO_CHAR(GATETIMESTAMP,'DD')) AS DAY, COUNT(*) AS CNT
                          FROM GATES
                          WHERE GATETIMESTAMP >= TO_DATE(:1, 'yyyy-mm-dd') AND
                                GATETIMESTAMP < TO_DATE(:2, 'yyyy-mm-dd') AND
                                CARGA = 'LL'
                          GROUP BY TERMINAL, TO_NUMBER(TO_CHAR(GATETIMESTAMP, 'DD'))`;

            this.cn.simpleExecute(strSql, [params.fechaInicio, params.fechaFin])
                .then(data => {
                    resolve({
                        status: "OK",
                        data: data.rows.map(item => ({
                            terminal: item.TERMINAL,
                            day: item.DAY,
                            cnt: item.CNT
                        }))
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

    getCountByHourMov (params) {
        return new Promise((resolve, reject) => {

            var strSql = `select mov, to_number(to_char(gatetimestamp, 'HH24')) hora,  count(*) cnt
                          from gates
                          where gatetimestamp >= TO_DATE(:1, 'yyyy-mm-dd') AND
                                gatetimestamp < TO_DATE(:2, 'yyyy-mm-dd') AND
                                carga = 'LL' AND
                                terminal = :3
                          group by mov, to_char(gatetimestamp, 'HH24')
                          ORDER BY to_char(gatetimestamp, 'HH24'), MOV`;

            this.cn.simpleExecute(strSql, [params.fechaInicio, params.fechaFin, params.terminal])
                .then(data => {
                    resolve({
                        status: "OK",
                        data: data.rows.map(item => ({
                            mov: item.MOV,
                            hour: item.HORA,
                            cnt: item.CNT
                        }))
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

    getCountByHour (params) {
        return new Promise((resolve, reject) => {

            var strSql = `select terminal, to_number(to_char(gatetimestamp, 'HH24')) hora,  count(*) cnt
                          from gates
                          where gatetimestamp >= TO_DATE(:1, 'yyyy-mm-dd') AND
                          gatetimestamp < TO_DATE(:2, 'yyyy-mm-dd')
                          group by terminal, to_char(gatetimestamp, 'HH24')`;

            this.cn.simpleExecute(strSql, [params.fechaInicio, params.fechaFin])
                .then(data => {
                    resolve({
                        status: "OK",
                        data: data.rows.map(item => ({
                            terminal: item.TERMINAL,
                            hour: item.HORA,
                            cnt: item.CNT
                        }))
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

            var strSql =`SELECT terminal,
                                to_number(to_char(gatetimestamp, 'YYYY')) year,
                                to_number(to_char(gatetimestamp, 'MM')) mes,
                                to_number(to_char(gatetimestamp, 'YYYYMM')) DIA,
                                count(*) cnt
                        FROM gates
                        WHERE gatetimestamp >= TO_DATE(:1, 'yyyy-mm-dd') AND
                              gatetimestamp < TO_DATE(:2, 'yyyy-mm-dd') AND
                              CARGA = 'LL'
                        GROUP BY terminal, to_char(gatetimestamp, 'YYYY'), to_char(gatetimestamp, 'MM'), to_char(gatetimestamp, 'YYYYMM')
                        ORDER BY DIA, TERMINAL`;

            this.cn.simpleExecute(strSql, [inicio, fin])
                .then(data => {
                    resolve({
                        status: "OK",
                        data: data.rows.map(item => ({
                            terminal: item.TERMINAL,
                            year: item.YEAR,
                            month: item.MES,
                            cnt: item.CNT
                        }))
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