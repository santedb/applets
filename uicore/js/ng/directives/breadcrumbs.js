/*
 * Copyright 2015-2019 Mohawk College of Applied Arts and Technology
 * 
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
 * User: Justin Fyfe
 * Date: 2019-8-8
 */

/// <reference path="../../santedb-ui.js"/>
/// <reference path="../../../../core/js/santedb.js"/>

angular.module('santedb-lib')
  
    /**
     * @method breadcrumbs
     * @memberof Angular
     * @summary Represents a directive which gathers breadcrumbs
     */
    .directive("breadcrumbs", ['breadcrumbService', function (breadcrumbService) {
        return {
            restrict: 'E',
            replace: true,
            priority: 100,
            templateUrl: './org.santedb.uicore/directives/breadcrumb.html',
            link: {
                pre: function (scope, element, attrs) {
                    breadcrumbService.generate();
                    scope.breadcrumbs = breadcrumbService.list;
                    breadcrumbService.change = () => scope.breadcrumbs = breadcrumbService.list;
                }
            }
            // controller: ['$scope', 'BreadcrumbService', function ($scope, BreadcrumbService) { BreadcrumbService.generate(); $scope.breadcrumbList = BreadcrumbService.list; }]
        };
    }]);