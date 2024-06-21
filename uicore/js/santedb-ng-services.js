/// <reference path="./santedb-ui.js"/>
/// <reference path="../../core/js/santedb.js"/>
/*
 * Copyright (C) 2021 - 2024, SanteSuite Inc. and the SanteSuite Contributors (See NOTICE.md for full copyright notices)
 * Copyright (C) 2019 - 2021, Fyfe Software Inc. and the SanteSuite Contributors
 * Portions Copyright (C) 2015-2018 Mohawk College of Applied Arts and Technology
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you 
 * may not use this file except in compliance with the License. You may 
 * obtain a copy of the License at 
 * 
 * http://www.apache.org/licenses/LICENSE-2.0 
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the 
 * License for the specific language governing permissions and limitations under 
 * the License.
 * 
 * User: fyfej
 * Date: 2023-5-19
 */
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

                        if(state.self.abstract)
                            _this.addBreadcrumb(state.self.displayName, state.name + ".index");
                        else
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