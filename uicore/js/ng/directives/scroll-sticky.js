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

/// <reference path="../../santedb-ui.js"/>
/// <reference path="../../../../core/js/santedb.js"/>

angular.module('santedb-lib')
    /**
     * @method provenance
     * @memberof Angular
     * @summary Renders a provenance info box
     */
    .directive('scrollSticky', ["$window", function ($window) {
        return {
            restrict: 'A',
            link: function (scope, element) {
    
                var current= $window.pageYOffset;
                var etop = $(element).offset().top;
                $(element).addClass("scrollSticky-container");
                angular.element($window).on("scroll", hideBarOnScroll);
    
                function hideBarOnScroll() {
                    var ref;
                    if ($window.scrollY >= etop) {
                         
                        
                        $(element).css({ position: 'fixed', top: '4em', left: $('#menuAccordian').width(), width:`calc(100% - ${$('#menuAccordian').width()}px)`, "z-index":100 });
                        $(element).parent().css({ height: $(element).height() });
                    } else {
                        $(element).css({ position: 'static', width: '100%' });
                    }
                    current = this.pageYOffset;
                    return scope.$apply();
                }
            }
        }
    }]);