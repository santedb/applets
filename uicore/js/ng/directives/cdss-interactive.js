/// <reference path="../../santedb-ui.js"/>
/// <reference path="../../../../core/js/santedb.js"/>
/// <reference path="../../../../core/js/santedb-cdss.js"/>
/// <reference path="../../../../core/js/santedb-model.js"/>
/*
 * Copyright (C) 2021 - 2025, SanteSuite Inc. and the SanteSuite Contributors (See NOTICE.md for full copyright notices)
 * Portions Copyright (C) 2019 - 2021, Fyfe Software Inc. and the SanteSuite Contributors
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
   .directive('cdssInteractive', ['$timeout', '$stateParams', function ($timeout, $stateParams) {


      return {
         restrict: 'A',
         link: function (scope, element, attrs, ngModel) {
            if (element[0].form) {
               var inputName = attrs.name;
               var form = SanteDB.display.getParentScopeVariable(scope, element[0].form.name);
               $(element).on('input', function () {
                  form[inputName].$setValidity("cdss", $(element).val() == ""); // Assume CDSS is not valid until run
               });
               $(element).on('blur touchend', async function () {
                  try {
                     var cdssInteractiveConfig = (scope.$eval(attrs.cdssInteractive) || scope.$parent.$eval(attrs.cdssInteractive));
                     var library = cdssInteractiveConfig?.libraries;
                     var targetObject = cdssInteractiveConfig?.target || cdssInteractiveConfig;

                     // Load the RCT if the supplied target has none
                     if (!targetObject.participation || !targetObject.participation.RecordTarget) {
                        var rct = null;
                        if (targetObject.version) { // has been saved - load direct
                           rct = await SanteDB.resources.entity.findAsync({ "participation[RecordTarget].act.relationship[HasComponent].target||participation[RecordTarget].act.relationship[HasComponent].target.relationship[HasComponent].target": targetObject.id, _includeTotal: false, _count: 1 }, "min");
                        }
                        else { // has not been saved get from parent 
                           rct = await SanteDB.resources.entity.findAsync({ "participation[RecordTarget].act": targetObject._getEncounter ? targetObject._getEncounter().id : $stateParams.id, _includeTotal: false, _count: 1 }, "min");
                        }
                        if (rct.resource) {
                           targetObject.participation = targetObject.participation || {};
                           targetObject.participation.RecordTarget = [
                              new ActParticipation({
                                 playerModel: rct.resource[0]
                              })
                           ];
                        }
                     }

                     var val = $(element).val();
                     if (val !== "") {
                        var proposals = [];
                        var issues = await SanteDBCdss.analyzeAsync(targetObject, true, library, proposals);
                        $timeout(() => {
                           // Set the validity
                           if (inputName) {
                              form[inputName].$setValidity("cdss", !issues.find(o => o.priority == "Error"));
                              form[inputName].$cdss = issues;
                           }

                           // We want to remove any action in the actEditBeingSet which is derived from the same thing we're derived from
                           var actEditCurrentActions = SanteDB.display.getParentScopeVariable(scope, "currentActions");
                           var actSourceModel = SanteDB.display.getParentScopeVariable(scope, "model");
                           if (!actEditCurrentActions || !actSourceModel) {
                              return;
                           }

                           var previousProposedActs = actEditCurrentActions.filter(o => o && o.targetModel && o.targetModel.relationship && o.targetModel.relationship.IsDerivedFrom && o.targetModel.relationship.IsDerivedFrom[0].target == targetObject.id);
                           previousProposedActs.forEach(p => {
                              actEditCurrentActions.splice(actEditCurrentActions.indexOf(p), 1);
                              actSourceModel.relationship.HasComponent.splice(actSourceModel.relationship.HasComponent.indexOf(p), 1);
                           });

                           // New proposals? 
                           if (proposals.length > 0) {

                              // Next we want to push these proposals onto the current act
                              proposals.forEach(p => {
                                 var ar = new ActRelationship({
                                    targetModel: p,
                                    relationshipType: ActRelationshipTypeKeys.HasComponent
                                 });

                                 actEditCurrentActions.push(ar);
                                 actSourceModel.relationship.HasComponent.push(ar);
                              });
                           }
                        });
                     }
                  }
                  catch (e) {
                     console.error("Error running CDSS", e);
                  }
               });
            }
            else {
               console.warn("Cannot bind CDSS callback - no form on element");
            }
         }
      }
   }]);