'use strict';

const gulp = require('gulp');
const jshint = require('gulp-jshint');

gulp.task('lint', () => {
  return gulp.src(`./lib/**/*.js`)
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'));
});

gulp.task('default', ['lint']);
