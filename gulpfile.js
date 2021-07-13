let project_folder = "dist";
let source_folder = "#src";

let fs = require('fs');

let path = {
   build: {
      html: project_folder + "/",
      css: project_folder + "/css/",
      js: project_folder + "/js/",
      img: project_folder + "/img/",
      fonts: project_folder + "/fonts/"
   },
   src: {
      html: [source_folder + "/*.html", "!" + source_folder + "/_*.html"],
      css: source_folder + "/scss/style.scss",
      js: source_folder + "/js/script.js",
      img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
      fonts: source_folder + "/fonts/*.ttf"
   },
   watch: {
      html: source_folder + "/**/*.html",
      css: source_folder + "/scss/**/*.scss",
      js: source_folder + "/js/**/*.js",
      img: source_folder + "/img/**/*.{jpg, png, svg, gif, ico, webp}"
   },
   clean: "./" + project_folder + "/"
}

//вбудована функція зі спеціальним призначенням: завантажувати модулі (наприклад: завантажує модуль "gulp" з node_modules)
let { src, dest } = require('gulp'),
   gulp = require('gulp'), // Підключаємо Gulp
   browsersync = require('browser-sync').create(), // Підключаємо Browser Sync
   fileinclude = require('gulp-file-include'), // Підключає файли
   del = require('del'), // Підключаємо бібліотеку для видалення файлів і папок
   scss = require('gulp-sass')(require('sass')), // Підключаємо Sass пакет
   autoprefixer = require('gulp-autoprefixer'), // Підключаємо бібліотеку для автоматичного додавання префіксів
   clean_css = require('gulp-clean-css'), // Оптимізує css
   rename = require('gulp-rename'), // Перейменовує файли
   uglify = require('gulp-uglify-es').default, // Оптимізує js
   imagemin = require('gulp-imagemin'), // Оптимізує картинки
   webp = require('gulp-webp'),  // Конвертує картинки у формат webp
   webhtml = require('gulp-webp-html'), // Інтегрує webp в html
   webpCss = require('gulp-webp-css'), // Інтегрує webp в css
   svgSprite = require('gulp-svg-sprite'), // Створює спрайт з svg 
   ttf2woff = require('gulp-ttf2woff'), // Конвертує шрифти
   ttf2woff2 = require('gulp-ttf2woff2'), // Конвертує шрифти
   fonter = require('gulp-fonter'); // Конвертує otf2ttf

function browserSync() {
   browsersync.init({
      server: {
         baseDir: "./" + project_folder + "/"
      },
      port: 3000,
      notify: false
   })
}

//pipe - це функція всередині якої ми пишемо деякі команди для gulp
function html() {
   return src(path.src.html)
      .pipe(fileinclude())
      .pipe(webhtml())
      .pipe(dest(path.build.html))
      .pipe(browsersync.stream())
}

function css() {
   return src(path.src.css)
      .pipe(
         scss({
            outputStyle: "expanded"
         })
      )
      .pipe(
         autoprefixer({
            overrideBrowserslist: ["last 5 versions"]
         })
      )
      .pipe(webpCss())
      .pipe(dest(path.build.css))
      .pipe(clean_css())
      .pipe(
         rename({
            extname: ".min.css"
         })
      )
      .pipe(dest(path.build.css))
      .pipe(browsersync.stream())
}

function js() {
   return src(path.src.js)
      .pipe(fileinclude())
      .pipe(dest(path.build.js))
      .pipe(uglify())
      .pipe(
         rename({
            extname: ".min.js"
         })
      )
      .pipe(dest(path.build.js))
      .pipe(browsersync.stream())
}

function images() {
   return src(path.src.img)
      .pipe(
         webp({
            quality: 50
         })
      )
      .pipe(dest(path.build.img))
      .pipe(src(path.src.img))
      .pipe(imagemin([
         imagemin.gifsicle({ interlaced: true }),
         imagemin.mozjpeg({ quality: 75, progressive: true }),
         imagemin.optipng({ optimizationLevel: 5 }),
         imagemin.svgo({
            plugins: [
               { removeViewBox: true },
               { cleanupIDs: false }
            ]
         })
      ]))
      .pipe(dest(path.build.img))
      .pipe(browsersync.stream())
}

function fonts() {
   src(path.src.fonts)
      .pipe(ttf2woff())
      .pipe(dest(path.build.fonts))
   return src(path.src.fonts)
      .pipe(ttf2woff2())
      .pipe(dest(path.build.fonts))
}

// Виконати в терміналі команду gulp otf2ttf
gulp.task('otf2ttf', function () {
   return src([source_folder + '/fonts/*.otf'])
      .pipe(
         fonter({
            formats: ['ttf']
         })
      )
      .pipe(dest(source_folder + '/fonts/'))
})

// Виконати в терміналі команду gulp svgSprite
gulp.task('svgSprite', function () {
   return gulp.src([source_folder + '/iconsprite/*.svg'])
      .pipe(
         svgSprite({
            mode: {
               stack: {
                  sprite: "../icons/icons.svg", //sprite file name
                  //example: true
               }
            },
         }
         ))
      .pipe(dest(path.build.img))
})

function fontsStyle(params) {

   let file_content = fs.readFileSync(source_folder + '/scss/fonts.scss');
   if (file_content == '') {
      fs.writeFile(source_folder + '/scss/fonts.scss', '', cb);
      return fs.readdir(path.build.fonts, function (err, items) {
         if (items) {
            let c_fontname;
            for (var i = 0; i < items.length; i++) {
               let fontname = items[i].split('.');
               fontname = fontname[0];
               if (c_fontname != fontname) {
                  fs.appendFile(source_folder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
               }
               c_fontname = fontname;
            }
         }
      })
   }
}

function cb() {

}

function watchFiles(params) {
   gulp.watch([path.watch.html], html);
   gulp.watch([path.watch.css], css);
   gulp.watch([path.watch.js], js);
   gulp.watch([path.watch.img], images);
}

function clean(params) {
   return del(path.clean);
}

//завдання виконуються по порядку
let build = gulp.series(clean, gulp.parallel(js, css, html, images, fonts), fontsStyle);
//завдання виконуються паралельно
let watch = gulp.parallel(build, watchFiles, browserSync);

exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;
