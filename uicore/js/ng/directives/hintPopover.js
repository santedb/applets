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
     * @method clippy
     * @memberof Angular
     * @summary Renders a simple helper info button - like clippy
     */
    .directive("hintPopover", ['$timeout', function ($timeout) {

        
        return {
            restrict: 'E',
            scope: {},
            replace: true,
            templateUrl: './org.santedb.uicore/directives/hintPopover.html',
            link: function (scope, element, attrs) {
                if(attrs.hintTitle) 
                {
                    $(element).attr('data-title', SanteDB.locale.getString(attrs.hintTitle));
                }
                
                if(attrs.hintText) {
                    $(element).attr('data-content', SanteDB.locale.getString(attrs.hintText));
                }
                else {
                    $(element).attr('data-content', SanteDB.locale.getString(`${attrs.hintTitle}.hint`));
                }
                
                $(element).ready(_=>$(element).popover({ trigger: 'hover',  html: true }));
            }
        }
    }]);