module.exports = function(grunt) {
  'use strict'

  grunt.initConfig({
    jade: {
      compile: {
        files: [{
          expand: true,
          cwd: "views/partials",
          src: "**/*.jade",
          dest: "public/partials",
          ext: ".html"
        }]
      },
      app: {
        files: {
          "public/index.html": "views/index.jade"
        }
      }
    },
    stylus: {
      compile: {
        options: {
          compress: true
        },
        files: [{
          expand: true,
          cwd: 'assets/stylus',
          // src: '**/*.styl',
          src: 'style.styl',
          dest: 'public/css',
          ext: '.css'
        }]
      }
    },
    concat: {
      app_ctrl: {
        src: ['assets/js/controllers/module.js'
            , 'assets/js/controllers/loginCtrl.js'
            , 'assets/js/controllers/appFrameCtrl.js'
            , 'assets/js/controllers/booksCtrl.js'
            , 'assets/js/controllers/bookCtrl.js'
            , 'assets/js/controllers/noteCtrl.js'
            , 'assets/js/controllers/editorCtrl.js'
            , 'assets/js/controllers/infoCtrl.js'
            , 'assets/js/controllers/friendsCtrl.js'
            , 'assets/js/controllers/favCtrl.js'
            , 'assets/js/controllers/evernoteCtrl.js'
             ],
        dest: 'assets/js/controllers.js'
      },
      app_service: {
        src: ['assets/js/services/authService.js'
            , 'assets/js/services/userService.js'
            , 'assets/js/services/bookService.js'
            , 'assets/js/services/noteService.js'
            , 'assets/js/services/serializeService.js'
            , 'assets/js/services/friendsService.js'
            , 'assets/js/services/favouriteService.js'
            , 'assets/js/services/translateService.js'
            , 'assets/js/services/evernoteService.js'
            , 'assets/js/services/httpLoadingIntercepter.js'
            , 'assets/js/services/httpOAuthIntercepter.js'
            , 'assets/js/services/filesystemService.js'
            , 'assets/js/services/analyticsService.js'
        ],
        dest: 'assets/js/services.js'
      },
      codemirror: {
        // html mode is htmlmixed mode
        src: ['bower_components/codemirror/lib/codemirror.js',
              'bower_components/codemirror/addon/display/placeholder.js',
              'bower_components/codemirror/addon/runmode/runmode.js',
              'bower_components/codemirror/addon/mode/overlay.js',
              'bower_components/codemirror/mode/python/python.js',
              'bower_components/codemirror/mode/commonlisp/commonlisp.js',
              'bower_components/codemirror/mode/xml/xml.js',
              'bower_components/codemirror/mode/html/html.js',
              'bower_components/codemirror/mode/php/php.js',
              'bower_components/codemirror/mode/sass/sass.js',
              'bower_components/codemirror/mode/sql/sql.js',
              'bower_components/codemirror/mode/perl/perl.js',
              'bower_components/codemirror/mode/commonlisp/commonlisp.js',
              'bower_components/codemirror/mode/javascript/javascript.js',
              'bower_components/codemirror/mode/clike/clike.js',
              'bower_components/codemirror/mode/ruby/ruby.js',
              'bower_components/codemirror/mode/css/css.js',
              'bower_components/codemirror/mode/markdown/markdown.js',
              'bower_components/codemirror/mode/gfm/gfm.js'
             ],
        dest: 'assets/lib/codemirror/codemirror.js'
      }
    },
    uglify: {
      develop: {
        options: {
          mangle: false,
          beautify: {
            beautify: true
          }
        },
        files: [{
          expand: true,
          cwd: "assets/js",
          src: ["**.js", "!*.sample.js"],
          dest: "public/js",
          ext: ".min.js"
        }]
      },
      release: {
        options: {
          mangle: false
        },
        files: [{
          expand: true,
          cwd: "assets/js",
          src: ["**.js", "!*.sample.js"],
          dest: "public/js",
          ext: ".min.js"
        }]
      },
      lib: {
        options: {
          mangle: false
        },
        files: [{
          expand: true,
          cwd: "assets/lib",
          src: ["*/**.js"],
          dest: "public/lib",
          ext: ".min.js"
        }]
      }
    },
    compress: {
      app: {
        options: {
          archive: 'anno.zip'
        },
        files: [{
          expand: true,
          cwd: "public/",
          src: ["**/*"],
          dest: "/"
        }]
      }
    },
    copy: {
      main: {
        files: [
          {
            expand: true,
            cwd: 'assets/resource/',
            src: '**',
            dest: 'public/'
          },
          {
            expand: true,
            cwd: 'bower_components/evernote/evernote-sdk-js/production/',
            src: '*-minified.js',
            dest: 'public/lib/evernote/',
            rename: function(dest, src) {
              return dest + src.replace('-minified', '.min')
            }
          }
        ]
      },
      develop: {
        files: [{
          expand: true,
          cwd: "assets/js",
          src: ["**.js", "!*.sample.js"],
          dest: "public/js",
          ext: ".min.js"
        }]
      }
    },
    watch: {
      jade: {
        files: ['views/partials/**/*.jade', 'views/index.jade'],
        tasks: ['jade']
      },
      stylus: {
        files: ['assets/stylus/**/*.styl'],
        tasks: ['stylus']
      },
      'js': {
        files: ['assets/js/**/*.js'],
        tasks: ['copy:develop', 'concat:app_ctrl', 'concat:app_service']
      },
      'js:lib': {
        files: ['assets/lib/**/*.js'],
        tasks: ['concat', 'uglify:lib']
      },
      copy: {
        files: ['assets/resource/**'],
        tasks: ['copy:main']
      }
    }
  })

  grunt.loadNpmTasks('grunt-contrib-jade')
  grunt.loadNpmTasks('grunt-contrib-stylus')
  grunt.loadNpmTasks('grunt-contrib-concat')
  grunt.loadNpmTasks('grunt-contrib-uglify')
  grunt.loadNpmTasks('grunt-contrib-compress')
  grunt.loadNpmTasks('grunt-contrib-watch')
  grunt.loadNpmTasks('grunt-contrib-copy')

  grunt.registerTask('html', ['jade'])
  grunt.registerTask('css', ['stylus'])

  grunt.registerTask('js:app', ['concat:app_ctrl', 'concat:app_service'])
  grunt.registerTask('js:lib', ['concat', 'uglify:lib'])
  grunt.registerTask('js:develop', ['js:lib', 'copy:develop'])
  grunt.registerTask('js:release', ['js:lib', 'js:app', 'uglify:release'])

  grunt.registerTask('default', ['jade', 'js:develop', 'stylus', 'copy'])
  grunt.registerTask('release', ['jade', 'js:release', 'stylus', 'copy:main', 'compress'])
}
