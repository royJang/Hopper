module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        watch : {
            index : {
                files: ['bin/public/css/less/**.*','bin/public/css/less/panel/**.**'],
                tasks: ['less'],
            },
            hopper : {
                files : ['bin/client/socket.io.js', 'bin/client/hopper.js'],
                tasks : ['uglify']
            }
        },
        less : {
            index: {
                files: {
                    "bin/public/css/main.css": "bin/public/css/less/main.less"
                }
            }
        },
        uglify : {
            hopper : {
                files: {
                    'bin/client/dist/hopper.js': ['bin/client/socket.io.js', 'bin/client/hopper.js']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-less');

    grunt.registerTask('dev', ['watch']);
    grunt.registerTask('pro', ['uglify']);
};