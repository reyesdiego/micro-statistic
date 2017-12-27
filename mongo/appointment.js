/**
 * Created by diego on 15/03/17.
 */
"use strict";

class Appointment {
    constructor () {
        this.model = require("./models/appointment.js");
    }

    getCountByHour (params) {
        return new Promise((resolve, reject) => {
            var moment = require("moment");
            var fechaInicio,
                fechaFin;

            if (params.fechaInicio) {
                fechaInicio = moment(moment(params.fechaInicio, ['YYYY-MM-DD'])).toDate();
            }

            if (params.fechaFin) {
                fechaFin = moment(moment(params.fechaFin, ['YYYY-MM-DD']).add(1, 'days')).toDate();
            }

            if (params.fecha !== undefined) {
                fechaInicio = moment(moment(params.fecha, ['YYYY-MM-DD'])).toDate();
                fechaFin = moment(fechaInicio).add(1, 'days').toDate();
            }

            var jsonParam = [
                {$match: { 'inicio': {$gte: fechaInicio, $lt: fechaFin} }},
                { $project: {'accessDate': { $subtract: [ '$inicio', 180 * 60 * 1000 ] }, terminal: '$terminal'} },
                { $group : {
                    _id : { terminal: '$terminal',
                        hour: { $hour : "$accessDate" }
                    },
                    cnt : { $sum : 1 }
                }},
                { $project: {
                    terminal: '$_id.terminal',
                    hour: '$_id.hour',
                    cnt: true
                }},
                { $sort: {'hour': 1, 'terminal': 1 }}
            ];

            this.model.aggregate(jsonParam, (err, data) => {
                if (err) {
                    reject({
                        status: "ERROR",
                        message: err.message,
                        data: err
                    });
                } else {
                    resolve({
                        status: "OK",
                        data: data
                    });
                }
            });
        });
    }

    getCountByDay (params) {
        return new Promise((resolve, reject) => {
            var moment = require("moment");
            var fechaInicio,
                fechaFin;

            if (params.fechaInicio) {
                fechaInicio = moment(moment(params.fechaInicio, ['YYYY-MM-DD'])).toDate();
            }

            if (params.fechaFin) {
                fechaFin = moment(moment(params.fechaFin, ['YYYY-MM-DD'])).toDate();
                fechaFin = moment(fechaInicio).add(1, 'days').toDate();
            }

            if (params.fecha !== undefined) {
                fechaInicio = moment(moment(params.fecha, ['YYYY-MM-DD'])).toDate();
                fechaFin = moment(fechaInicio).add(1, 'days').toDate();
            }

            var jsonParam = [
                {$match: {
                    inicio: {$gte: fechaInicio},
                    fin:    {$lt: fechaFin}}
                },
                { $project: {'accessDate': { $subtract: [ '$inicio', 180 * 60 * 1000 ] }, terminal: '$terminal'} },
                //{ $project: {'accessDate': '$inicio', terminal: '$terminal'} },
                { $group : {
                    _id : { terminal: '$terminal',
                        day: { $dayOfMonth : "$accessDate" }
                    },
                    cnt : { $sum : 1 }
                }},
                { $project: {
                    _id: false,
                    terminal: '$_id.terminal',
                    day: '$_id.day',
                    cnt: true
                }},
                { $sort: {'day': 1, 'terminal': 1 }}
            ];
            this.model.aggregate(jsonParam, (err, data) => {
                if (err) {
                    reject({
                        status: "ERROR",
                        message: err.message,
                        data: err
                    });
                } else {
                    resolve({
                        status: "OK",
                        data: data
                    });
                }
            });
        });
    }

    getCountByMonth (params) {
        return new Promise((resolve, reject) => {
            var moment = require("moment");

            var date,
                monthsAgo,
                date5MonthsAgo,
                nextMonth,
                jsonParam;

            date = moment().subtract(moment().date() - 1, 'days').format('YYYY-MM-DD');
            if (params.fecha !== undefined) {
                date = moment(params.fecha, 'YYYY-MM-DD').subtract(moment(params.fecha).date() - 1, 'days');
            }
            monthsAgo = 4;
            if (params.monthsAgo) {
                monthsAgo = params.monthsAgo;
            }

            date5MonthsAgo = moment(date).subtract(monthsAgo, 'months').toDate();
            nextMonth = moment(date).add(1, 'months').toDate();

            jsonParam = [
                {$match: { 'inicio': {$gte: date5MonthsAgo, $lt: nextMonth} }},
                { $project: {
                    accessDate: { $subtract: [ '$inicio', 180 * 60 * 1000 ] },
                    dia: {$dateToString: { format: "%Y%m", date: {$subtract: ['$inicio', 180 * 60 * 1000]} }},
                    terminal: '$terminal'
                }},
                { $group : {
                    _id : { terminal: '$terminal',
                        year: { $year : "$accessDate" },
                        month: { $month : "$accessDate" },
                        dia: '$dia'
                    },
                    cnt : { $sum : 1 }
                }},
                { $project: {
                    terminal: '$_id.terminal',
                    year: '$_id.year',
                    month: '$_id.month',
                    dia: '$_id.dia',
                    cnt: true
                }},
                { $sort: {'dia': 1, 'terminal': 1 }}
            ];


            this.model.aggregate(jsonParam)
            .exec((err, data) => {
                    if (err) {
                        reject({
                            status: "ERROR",
                            message: err.message,
                            data: err
                        });
                    } else {
                        resolve({
                            status: "OK",
                            data: data
                        });
                    }
                });
        });
    }
}

module.exports = Appointment;