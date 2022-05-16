const gulp = require('gulp');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const minifyCSS = require('gulp-csso');
const autoprefixer = require('gulp-autoprefixer');
const postcss = require('gulp-postcss');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');

const sync = require('browser-sync').create();

// HTML

const html = () => {
  return gulp.src("src/*.html")
    .pipe(gulp.dest("./public"))
    .pipe(sync.stream())
};

// CSS

const css = () => {
  return gulp.src('src/sass/main.s[ac]ss')
    .pipe(sass({ outputStyle: 'expanded' }))
    .pipe(postcss([
      require('postcss-custom-properties')()
    ]))
    .pipe(autoprefixer({
      overrideBrowserslist: ['last 4 versions']
    }))
    // .pipe(minifyCSS())
    .pipe(gulp.dest('public/css'))
    .pipe(sync.stream({ match: '**/*.css' }))
};

// JS

const js = () => {
  return gulp.src('src/js/index.js')
    .pipe(babel())
    // .pipe(uglify())
    .pipe(concat('index.js'))
    .pipe(gulp.dest('public/js'))
    .pipe(sync.stream())
};

// Watch

const watch = () => {
  gulp.watch("src/*.html",  gulp.series(html));
  gulp.watch("src/sass/**", gulp.series(css));
  gulp.watch("src/js/**",   gulp.series(js));
};

// Server

const server = () => {
  sync.init({
    server: {
      baseDir: "./public"
    },
    ui: false,
    notify: false
  });
};

// Default

exports.default = gulp.series(
  gulp.parallel(
    html,
    css,
    js
  ),
  gulp.parallel(
    watch,
    server
  )
);