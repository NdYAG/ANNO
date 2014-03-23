'use strict'

module.exports = function(grunt) {
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
      codemirror: {
        // html mode is htmlmixed mode
        src: ['bower_components/codemirror/codemirror.js', 'bower_components/codemirror/addon/display/placeholder.js', 'bower_components/codemirror/addon/runmode/runmode.js', 'bower_components/codemirror/mode/python/python.js', 'bower_components/codemirror/mode/commonlisp/commonlisp.js', 'bower_components/codemirror/mode/html/html.js', 'bower_components/codemirror/mode/clike/clike.js', 'bower_components/codemirror/mode/php/php.js', 'bower_components/codemirror/mode/sass/sass.js', 'bower_components/codemirror/mode/sql/sql.js', 'bower_components/codemirror/mode/perl/perl.js', 'bower_components/codemirror/mode/commonlisp/commonlisp.js'],
        dest: 'public/lib/codemirror/codemirror.js'
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
          src: ["*.js", "!*.sample.js"],
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
          src: ["*.js", "!*.sample.js"],
          dest: "public/js",
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
    watch: {
      jade: {
        files: ['views/partials/**/*.jade', 'views/index.jade'],
        tasks: ['jade']
      },
      stylus: {
        files: ['assets/stylus/**/*.styl'],
        tasks: ['stylus']
      },
      js: {
        files: ['assets/js/**/*.js'],
        tasks: ['uglify:development']
      }
    }
  })

  grunt.loadNpmTasks('grunt-contrib-jade')
  grunt.loadNpmTasks('grunt-contrib-stylus')
  grunt.loadNpmTasks('grunt-contrib-concat')
  grunt.loadNpmTasks('grunt-contrib-uglify')
  grunt.loadNpmTasks('grunt-contrib-compress')
  grunt.loadNpmTasks('grunt-contrib-watch')

  grunt.registerTask('html', ['jade'])
  grunt.registerTask('css', ['stylus'])
  grunt.registerTask('js', ['uglify'])
  grunt.registerTask('js:develop', ['uglify:develop'])
  grunt.registerTask('js:release', ['uglify:release'])

  grunt.registerTask('default', ['jade', 'js:develop', 'stylus'])
  grunt.registerTask('release', ['jade', 'js:release', 'stylus', 'compress'])
}
