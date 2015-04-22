module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        watch : {
            index : {
                files: 'bin/public/css/less/**.*',
                tasks: ['less'],
            }
        },
        less : {
            index: {
                files: {
                    "bin/public/css/main.css": "bin/public/css/less/main.less"
                }
            },
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-less');

    grunt.registerTask('dev', ['watch']);
    grunt.registerTask('pro', ['uglify']);
};