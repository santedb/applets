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
     * @summary Entity Address Editing
     * @memberof Angular
     * @method addressEdit
     */
    .directive('addressEdit', ['$rootScope', function ($rootScope) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: './org.santedb.uicore/directives/addressEdit.html',
            scope: {
                address: '='
            },
            controller: ['$scope', '$rootScope', function ($scope, $rootScope) {


            }],
            link: function (scope, element, attrs) {

                if (!scope.address)
                    SanteDB.resources.concept.getAsync(AddressUseKeys.HomeAddress)
                        .then(function (d) {
                            scope.address = {
                                HomeAddress: {
                                    useModel: d
                                }
                            };
                            try {
                                scope.$apply();
                            }
                            catch (e) { }
                        })
                        .catch(function (e) { });
            }
        }
    }])
    /**
    * @summary Entity Name Editing
    * @memberof Angular
    * @method nameEdit
    */
    .directive('nameEdit', ['$rootScope', function ($rootScope) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: './org.santedb.uicore/directives/nameEdit.html',
            scope: {
                name: '=',
                simpleName: '<'
            },
            controller: ['$scope', '$rootScope', function ($scope, $rootScope) {


            }],
            link: function (scope, element, attrs) {

                if (!scope.name)
                    SanteDB.resources.concept.getAsync(NameUseKeys.Legal)
                        .then(function (d) {
                            scope.name = {
                                Legal: {
                                    useModel: d
                                }
                            };
                            try {
                                scope.$apply();
                            }
                            catch (e) { }
                        })
                        .catch(function (e) { });
            }
        }
    }])
    /**
    * @summary Entity Telecom Editing
    * @memberof Angular
    * @method telecomEdit
    */
   .directive('telecomEdit', ['$rootScope', function ($rootScope) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: './org.santedb.uicore/directives/telecomEdit.html',
        scope: {
            telecom: '='
        },
        controller: ['$scope', '$rootScope', function ($scope, $rootScope) {


        }],
        link: function (scope, element, attrs) {

            if (!scope.telecom)
                scope.telecom = {};
            
            Object.keys(TelecomAddressUseKeys).forEach((k)=>
            {
                if(!scope.telecom[k])
                    scope.telecom[k] = {};
                if(!scope.telecom[k].type) 
                    scope.telecom[k].type = /^mailto:.*$/i.test(scope.telecom[k].value) ?  "c1c0a4e9-4238-4044-b89b-9c9798995b93" : "c1c0a4e9-4238-4044-b89b-9c9798995b99";

                if(scope.telecom[k].value)
                    scope.telecom[k].editValue = scope.telecom[k].value.replace(/(tel:|mailto:)/i, '');
            });

            scope.$watch((s) => Object.keys(s.telecom).map((o)=>s.telecom[o].editValue).join(";"), function(n, o) {
                Object.keys(scope.telecom).forEach((k)=> {
                    if(scope.telecom[k].editValue)
                        switch(scope.telecom[k].type) {
                            case "c1c0a4e9-4238-4044-b89b-9c9798995b93":
                                scope.telecom[k].value = "mailto:" + scope.telecom[k].editValue;
                                break;
                            default:
                                scope.telecom[k].value = "tel:" + scope.telecom[k].editValue;
                                break;
                        }
                });
            })
        }
    }
}]);