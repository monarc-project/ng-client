module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        nggettext_extract: {
            pot: {
                files: {
                    'po/template.pot': ['views/**/*.html', 'views/dialogs/**/*.html', 'src/**/*.js']
                }
            }
        },

        nggettext_compile: {
            all: {
                files: {
                    '../../public/js/translations.js': ['po/*.po']
                }
            }
        },

        concat: {
            options: {
                separator: ";\n"
            },
            angularCommonLibsJs: {
                src: [
                    'node_modules/angular/angular.min.js',
                    'node_modules/angular-animate/angular-animate.min.js',
                    'node_modules/angular-aria/angular-aria.min.js',
                    'node_modules/angular-gettext/dist/angular-gettext.min.js',
                    'node_modules/angular-material/angular-material.min.js',
                    'node_modules/angular-ui-router/release/angular-ui-router.min.js',
                    'node_modules/angular-resource/angular-resource.min.js',
                    'node_modules/angular-local-storage/dist/angular-local-storage.min.js',
                    'node_modules/angular-material-data-table/dist/md-data-table.min.js',
                    'node_modules/angular-breadcrumb/release/angular-breadcrumb.min.js',
                    'node_modules/ng-file-upload/dist/ng-file-upload.min.js',
                    'node_modules/ng-inline-edit/dist/ng-inline-edit.min.js',
                    'node_modules/angular-ui-tree/dist/angular-ui-tree.min.js',
                    'node_modules/angular-messages/angular-messages.min.js',
                    'node_modules/angular-toastr/dist/angular-toastr.tpls.min.js',
                ],
                dest: '../../public/js/angular-common-libs.js',
                nonull: true
            },

            angularCommonLibsCss: {
                src: [
                    'node_modules/angular-material/angular-material.min.css',
                    'node_modules/angular-material-data-table/dist/md-data-table.min.css',
                    'node_modules/ng-inline-edit/dist/ng-inline-edit.min.css',
                    'node_modules/angular-ui-tree/dist/angular-ui-tree.min.css',
                    'node_modules/angular-toastr/dist/angular-toastr.min.css'
                ],
                dest: '../../public/css/angular-common-libs.css',
                nonull: true
            }
        },

        uglify: {
            appJs: {
                files: {
                    // '../../public/js/app.min.js': ['public/js/Starter.js', 'public/js/StarterController.js', 'public/js/translations.js'],
                    '../../public/js/angular-common-libs.min.js': ['../../public/js/angular-common-libs.js']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-angular-gettext');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    // Default task(s).
    grunt.registerTask('default', []);
    grunt.registerTask('extract_translations', ['nggettext_extract']);
    grunt.registerTask('compile_translations', ['nggettext_compile']);
    grunt.registerTask('concat_assets', ['concat', 'uglify']);
};
