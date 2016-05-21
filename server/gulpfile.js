'use strict';
var gulp       = require('gulp');
var sass       = require('gulp-sass');
var browserify = require('browserify');
var source     = require('vinyl-source-stream');
var livereload = require('gulp-livereload');

gulp.task('sass', function () {
  return gulp.src('./app/resources/sass/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(livereload())
    .pipe(gulp.dest('./public'));
});

gulp.task('browserify', function() {
    return browserify('./app/resources/js/bundle.js')
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(livereload())
        .pipe(gulp.dest('./public/'));
});

gulp.task('watch', function () {
  gulp.watch(
  ['./app/resources/sass/**/*.scss', './app/resources/js/**/*.js'], ['sass', 'browserify']
  );
});
