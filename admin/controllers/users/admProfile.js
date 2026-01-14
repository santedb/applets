/// <reference path="../../../core/js/santedb.js"/>
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
angular.module('santedb')
    .controller('AdminUserProfileWidgetController', ["$scope", "$rootScope", "$timeout", function ($scope, $rootScope, $timeout) {

        /**
         * Extracts the effective target key for a relationship
         * @param {*} relationship The relationship to inspect
         */
        function getRelationshipTarget(relationship) {
            return relationship ? (relationship.target || (relationship.targetModel && relationship.targetModel.id)) : null;
        }

        /**
         * Adds delete operations for relationships removed in the editor
         * @param {*} submissionObject The object being sent to the API
         */
        function markRemovedManagedFacilities(submissionObject) {
            const original = $scope.originalManagedFacilities || [];
            const current = (submissionObject.relationship && submissionObject.relationship.MaintainedEntity) || [];

            const currentTargets = current.map(getRelationshipTarget).filter(o => o);
            const removed = original.filter(rel => {
                const target = getRelationshipTarget(rel);
                return target && !currentTargets.includes(target);
            });

            if (!removed.length) {
                return;
            }

            submissionObject.relationship = submissionObject.relationship || {};
            submissionObject.relationship.MaintainedEntity = submissionObject.relationship.MaintainedEntity || [];

            removed.forEach(rel => {
                const target = getRelationshipTarget(rel);
                if (!target) {
                    return;
                }
                submissionObject.relationship.MaintainedEntity.push({
                    id: rel.id,
                    target: target,
                    relationshipType: EntityRelationshipTypeKeys.MaintainedEntity,
                    operation: BatchOperationType.Delete
                });
            });
        }
        /**
         * Updates the user entity
         */
        $scope.update = async function (form) {

            if (form.$invalid) return; // don't process invalid form

            // Now post the changed update object 
            try {
                var submissionObject = angular.copy($scope.editObject);
                markRemovedManagedFacilities(submissionObject);
                await prepareEntityForSubmission(submissionObject);

                submissionObject.securityUser = submissionObject.securityUser || $rootScope.session.user.id;
                // Find the preferred language
                submissionObject.language = submissionObject.language || [];
                if ($scope.editObject.preferredLanguage) {
                    var personLanguage = new PersonLanguageCommunication({ isPreferred: true, languageCode: $scope.editObject.preferredLanguage.languageCode });
                    if (!submissionObject.language.find(o => o.isPreferred)) {
                        submissionObject.language.push(personLanguage);
                    }
                }
                if (submissionObject.version) {
                    $scope.scopedObject = await SanteDB.resources.userEntity.updateAsync(submissionObject.id, submissionObject);
                }
                else {
                    $scope.scopedObject = await SanteDB.resources.userEntity.insertAsync(submissionObject);
                }

                var refetch = await SanteDB.resources.userEntity.getAsync($scope.scopedObject.id, "full"); // re-fetch the entity
                $timeout(() => $scope.scopedObject = refetch);
                toastr.success(SanteDB.locale.getString("ui.model.userEntity.saveSuccess"));
                form.$valid = true;
            }
            catch (e) {
                $rootScope.errorHandler(e);
                form.$valid = false;
            }
        }

        $scope.$watch("scopedObject", async function (n, o) {
            if (n && n != null) {
                delete ($scope.editObject); // Delete the current edit object
                $scope.editObject = angular.copy(n);
                $scope.originalManagedFacilities = angular.copy((n.relationship && n.relationship.MaintainedEntity) || []) || [];
            }
        });

        $scope.filterManagedFacilities = function (data) {
            const facilities = $scope.editObject.relationship.DedicatedServiceDeliveryLocation.map((loc) => { return loc.target });
            
            return facilities.includes(data.id);
        }
    }]);
