'use strict';
 
var gulp            = require('gulp'),
    sass            = require('gulp-sass'),
    rename          = require('gulp-rename'),
    minifyCss       = require('gulp-minify-css'),
    uglify          = require('gulp-uglify'),
    concat          = require('gulp-concat'),
    fs              = require('fs'),
    browserSync     = require('browser-sync'),
    nodemon         = require('gulp-nodemon'),
    autoprefixer    = require('gulp-autoprefixer'),
    browserify      = require('browserify'),
    source          = require('vinyl-source-stream'),
    buffer          = require('vinyl-buffer');

/********************************************************
* DEFINE PROJECTS AND THEIR PATHS                       *
********************************************************/
    var projectCssPath = './public/stylesheets/';
    var projectJsPath = './public/javascripts/';

/********************************************************
* SASS                                                  *
********************************************************/
    gulp.task('sass', function() {
        return gulp.src('./sass/import.scss')
            .pipe(sass().on('error', sass.logError))
            .pipe(rename('style.css'))
            .pipe(autoprefixer({
                browsers: ['last 2 versions'],
                cascade: false
            }))
            .pipe(gulp.dest(projectCssPath))
            .pipe(rename('style.min.css'))
            .pipe(minifyCss())
            .pipe(gulp.dest(projectCssPath));
    });

/********************************************************
* LIBRARY CSS                                           *
********************************************************/
    gulp.task('libcss', function () {
        return gulp.src(['./node_modules/normalize.css/normalize.css', './node_modules/font-awesome/css/font-awesome.css'])
            .pipe(concat('lib.css'))
            .pipe(gulp.dest(projectCssPath))
            .pipe(rename('lib.min.css'))
            .pipe(minifyCss())
            .pipe(gulp.dest(projectCssPath));
    });

/********************************************************
* SCRIPTS                                               *
********************************************************/
    gulp.task('scripts', function() {
        return browserify('./javascripts/import.js')
            .bundle() // Compile the js
            .pipe(source('script.js')) //Pass desired output filename to vinyl-source-stream
            .pipe(gulp.dest(projectJsPath)) // Output the file
            .pipe(buffer()) // convert from streaming to buffered vinyl file object
            .pipe(rename('script.min.js')) // Rename the minified version
            .pipe(uglify()) // Minify the file
            .pipe(gulp.dest(projectJsPath)); // Output the minified file
    });

/********************************************************
* FONT AWESOME                                          *
********************************************************/
    gulp.task('fonts', function() {
        gulp.src('./node_modules/font-awesome/fonts/*')
            .pipe(gulp.dest('./public/fonts/'));
    });

/********************************************************
* INIT TASK                                             *
********************************************************/
    gulp.task('init',['libcss', 'scripts', 'fonts']);

/********************************************************
* SETUP BROWSER SYNC                                    *
********************************************************/
    gulp.task('browser-sync', ['nodemon'], function() {
        browserSync.init(null, {
            proxy: "http://localhost:3000",
            files: ["public/**/*.*"],
            port: "5000"
        });
    });

/********************************************************
* SETUP NODEMON                                         *
********************************************************/
    gulp.task('nodemon', function (cb) {       
        var started = false;
        
        return nodemon({
            script: './bin/www',
            env: { 'NODE_ENV': 'development' },
            ignore: [
                './javascripts/**/*.js',
                './public/',
                './gulpfile.js'
            ]
        }).on('start', function () {
            if (!started) {
                cb();
                started = true; 
            }  
        });
    });

/********************************************************
* WATCH TASKS                                           *
********************************************************/
    gulp.task('watch', function () {
        gulp.watch(['./sass/**/*.scss'], ['sass']);
        gulp.watch(['./javascripts/**/*.js'], ['scripts']);
    });

/********************************************************
* DEFAULT TASKS                                         *
********************************************************/
    gulp.task('default',['watch', 'browser-sync']);