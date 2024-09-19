/// <reference path="../../santedb-ui.js"/>
/// <reference path="../../../../core/js/santedb.js"/>
/// <reference path="../../../../core/js/santedb-cdss.js"/>
/// <reference path="../../../../core/js/santedb-model.js"/>
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

angular.module('santedb-lib')
   /**
   * @summary Display and sets the result of a CDSS validation event
   * @memberof Angular
   */
   .directive('cdssInteractive', ['$timeout', function ($timeout) {


      return {
         restrict: 'A',
         link: function (scope, element, attrs, ngModel) {
            $(element).on('blur', async function() {

               try {
                  var cdssInteractiveConfig = scope.$eval(attrs.cdssInteractive);
                  var library = cdssInteractiveConfig.libraries;
                  var targetObject = cdssInteractiveConfig.target || cdssInteractiveConfig;
                  var inputName = attrs.name;
                  var form = SanteDB.display.getParentScopeVariable(scope, element[0].form.name);
                  var issues = await SanteDBCdss.analyzeAsync(new Bundle({ resource: [ targetObject ] }), true, library);
                  
                  $timeout(() => 
                  {
                     // Set the validity
                     if(inputName) {
                        form[inputName].$setValidity("cdss", !issues.find(o=>o.priority == "Error"));
                        form[inputName].$cdss = issues;
                     }


                  })
               }
               catch (e){
                  console.error("Error running CDSS", e);
               }
            });
         }
      }
   }]);