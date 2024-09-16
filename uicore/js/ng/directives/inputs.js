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
 */

/// <reference path="../../santedb-ui.js"/>
/// <reference path="../../../../core/js/santedb.js"/>

angular.module('santedb-lib')

    /**
     * @method inputCopyButton
     * @memberof Angular
     * @summary Creates an input button with an easy copy button
     * @param {string} source The source copy
     */
    .directive("inputCopyButton", function () {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: './org.santedb.uicore/directives/inputCopy.html',
            scope: {
                source: '=',
                buttonClass: '<'
            },
            controller: ["$scope", function ($scope) {
                $scope.copyInput = function () {
                    if (navigator.clipboard)
                        navigator.clipboard.writeText($scope.source);

                }
            }],
            link: function(scope, element, attrs){
                if (typeof scope.buttonClass === 'string'){
                    element.children().addClass(scope.buttonClass);
                }
            }
        }
    })
    /**
     * @method tagInput
     * @memberof Angular
     * @summary Creates a tagged input
     */
    .directive("tagInput", function () {
        return {
            require: 'ngModel',
            restrict: 'E',
            replace: true,
            templateUrl: './org.santedb.uicore/directives/tagInput.html',
            scope: {

            },
            link: function (scope, element, attrs, ngModel) {

                // Parsers
                ngModel.$parsers.unshift(function (viewValue) {
                    if (Array.isArray(viewValue))
                        return viewValue.join(",")
                    return viewValue.split(",");
                });
                ngModel.$formatters.unshift(function (viewValue) {
                    if (viewValue)
                        return String(viewValue).split(',');
                });

                // Token field initialization
                $(element).tokenfield({
                    createTokensOnBlur: true,
                    delimiter: [',', ' ']
                });

                ngModel.$render = function () {
                    var viewValue = ngModel.$viewValue;
                    if (Array.isArray(viewValue))
                        $(element).tokenfield('setTokens', viewValue);
                    else if (viewValue)
                        $(element).tokenfield('setTokens', viewValue.split(','));
                    //$(element).trigger('change');
                };
            }
        }
    })
;