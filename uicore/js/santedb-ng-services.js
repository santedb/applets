/// <reference path="./santedb-ui.js"/>
/// <reference path="../../core/js/santedb.js"/>

angular.module('santedb-lib')
    /**
     * @method breadcrumbService
     * @memberof Angular
     * @summary A service which gathers the path to the current page 
     */
    .provider("breadcrumbService", function breadcrumbProvider() {

        this.$get = ['$state', '$transitions', function ($state, $transitions) {

            var breadcrumb = function () {
                var _this = this;
                this.list = [];
                this.getProperty = function (object, path) {
                    function index(obj, i) {
                        return obj[i];
                    }

                    return path.split('.').reduce(index, object);
                };
                this.addBreadcrumb = function (title, state) {

                    _this.list.push({
                        title: SanteDB.locale.getString(title),
                        state: state
                    });
                };
                this.generateBreadcrumbs = function (state) {
                    if (angular.isDefined(state.parent) && state.parent) {
                        _this.generateBreadcrumbs(state.parent);
                    }

                    if (angular.isDefined(state.self.displayName)) {
                        _this.addBreadcrumb(state.self.displayName, state.name);
                    }
                };
                this.appendTitle = function (translation, index) {
                    var title = translation;

                    if (index < _this.list.length - 1) {
                        title += ' > ';
                    }

                    return title;
                };
                this.generateTitle = function () {
                    title = '';

                    angular.forEach(_this.list, function (breadcrumb, index) {
                        title = breadcrumb.title;
                    });
                };
                this.generate = function () {
                    _this.list = [];
                    _this.generateBreadcrumbs($state.$current);
                    _this.generateTitle();
                    if (_this.change)
                        _this.change();
                },
                    this.getList = function () {
                        return _this.list;
                    }

                $transitions.onSuccess({}, function () {
                    _this.generate();
                });
            }

            return new breadcrumb();
        }];
    });