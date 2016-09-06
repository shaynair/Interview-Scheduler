// This file uses Gulp plugins to automate tasks.
// Requires
const gulp = require("gulp");
const sourcemaps = require('gulp-sourcemaps');
const changed = require('gulp-changed');
const concat = require('gulp-concat');
const nodemon = require('gulp-nodemon');

// JS
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');

// CSS
const nano = require('gulp-cssnano');
const autoprefixer = require('gulp-autoprefixer');

// Clean
const del = require('del');

const paths = {
	scripts: ['static/scripts/*.js', 'public/assets/scripts'],
	css: ['static/stylesheets/*.css', 'public/assets/stylesheets']
};

// Cleans all gulp files
gulp.task('clean', () => {
	return del([paths.scripts[1], paths.images[1],
		paths.css[1]
	]);
});

// Minify and copy all JavaScript (except vendor scripts) 
gulp.task('scripts', () => {
	return gulp.src(paths.scripts[0], {
			extension: '.js'
		})
		.pipe(changed(paths.scripts[0]))
		.pipe(sourcemaps.init())
		.pipe(babel({
			presets: ['es2015']
		}))
		.pipe(concat('all.min.js'))
		.pipe(uglify())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(paths.scripts[1]));
});

// Pre-process CSS
gulp.task('css', () => {
	return gulp.src(paths.css[0], {
			extension: '.css'
		})
		.pipe(changed(paths.css[0]))
		.pipe(autoprefixer())
		.pipe(nano())
		.pipe(concat('style.css'))
		.pipe(gulp.dest(paths.css[1]))
});

gulp.task('watch', () => {
	for (let s in paths) {
		gulp.watch(paths[s][0], [s]);
	}
});

// start our server and listen for changes: only after tests have passed
gulp.task('server', Object.keys(paths), () => {
    // configure nodemon
    return nodemon({
        script: 'server.js',
        watch: ["server.js", "server/*"],
        ext: 'js'
    });
});


// The default task (run on server start)
gulp.task('default', Object.keys(paths).concat('watch').concat('server'));