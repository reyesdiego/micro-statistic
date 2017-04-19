/**
 * Created by diego on 14/03/17.
 */
"use strict";

var gulp = require("gulp"),
    gulpUtil = require("gulp-util"),
    gulpClean = require("gulp-clean");

gulp.task('clean', () => {
    return gulp.src('built/', { base: './' })
        .pipe(gulpClean());
});

gulp.task('copy', ['clean'], () => {
    var dirs = [
        'oracle/**/*',
        'mongo/**/*',
        'config/**/*',
        'node_modules/**/*',
        'pm2Start-Mongo.sh',
        'pm2Start-Oracle.sh',
        'package.json'
    ];
    return gulp.src(dirs, { base: './' })
        .pipe(gulp.dest('./built/'));
});

gulp.task('default', ['copy'], () => {
    return gulpUtil.log('Gulp Finished!');
});
