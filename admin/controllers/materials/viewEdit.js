/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../../core/js/santedb-model.js"/>
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
angular.module("santedb").controller("MaterialViewEditController", ["$scope", "$rootScope", "$stateParams", "$timeout", "$state", function ($scope, $rootScope, $stateParams, $timeout, $state) {

    const entityTemplate = new Material({
        determinerConcept: DeterminerKeys.Described,
        relationship: {
            Parent: [],
            RegulatedProduct: [],
            UsedEntity: [],
            ManufacturedProduct: []
        },
        name: {
            OfficialRecord: [{
                component: {
                    $other: []
                },
                use: NameUseKeys.OfficialRecord
            }],
            Assigned: [{
                component: {
                    $other: []
                },
                use: NameUseKeys.Assigned
            }]
        },
        note: [
            {
                text: ""
            }
        ],
        statusConcept: StatusKeys.Active,
    });

    async function loadHistory(material) {
        try {
            var history = await SanteDB.resources.material.findAssociatedAsync(material.id, "_history", {}, "dropdown");
            material._history = history.resource;
        }
        catch (e) {
            console.error(e);
        }
    }

    async function initialize(materialId) {
        try {

            var material = null;
            if (materialId) {
                material = await SanteDB.resources.material.getAsync(materialId, "full");
                loadHistory(material);
                // Load the reverse relationships
                var reverseRelationships = await SanteDB.resources.entityRelationship.findAsync({
                    target: materialId,
                    relationshipType: [
                        EntityRelationshipTypeKeys.RegulatedProduct,
                        EntityRelationshipTypeKeys.ManufacturedProduct,
                        EntityRelationshipTypeKeys.Parent
                    ]
                }, 'reverseRelationship');

                material.relationship = material.relationship || {};
                if (reverseRelationships.resource) {
                    material.relationship.RegulatedProduct = reverseRelationships.resource.filter(o => o.relationshipType == EntityRelationshipTypeKeys.RegulatedProduct);
                    material.relationship.ManufacturedProduct = reverseRelationships.resource.filter(o => o.relationshipType == EntityRelationshipTypeKeys.ManufacturedProduct);
                    material.relationship.Child = reverseRelationships.resource.filter(o => o.relationshipType == EntityRelationshipTypeKeys.Parent);
                }

                if (material.extension && material.extension['http://santedb.org/extensions/core/targetCondition']) {
                    material.extension['http://santedb.org/extensions/core/targetCondition'] = await Promise.all(
                        material.extension['http://santedb.org/extensions/core/targetCondition'].map(async function (cd) {
                            try {
                                return await SanteDB.application.resolveReferenceExtensionAsync(cd);
                            }
                            catch (e) {
                                return null;
                            }
                        })
                    );
                }

                material.relationship = material.relationship || {};
                material.relationship.UsedEntity = material.relationship.UsedEntity || [];
                material.relationship.HasPart = material.relationship.HasPart || [];
                material.relationship.Parent = material.relationship.Parent || [];
                material.relationship.HasIngredient = material.relationship.HasIngredient || [];
                material.relationship.RegulatedProduct = material.relationship.RegulatedProduct || [];
                material.note = material.note || [];

            }
            else {
                material = angular.copy(entityTemplate);
                $scope.$watch("entity.typeConcept", async function (n, o) {
                    if (n && n != o) {
                        try {
                            var concept = await SanteDB.resources.concept.getAsync(n, 'min');

                            $timeout(() => {
                                $scope.entity.isAdministrable = concept.conceptSet.find(o => o == "ab16722f-dcf5-4f5a-9957-8f87dbb390d5") != null;
                                $scope.entity.name.OfficialRecord = [{ component: { $other: [SanteDB.display.renderConcept(concept)] } }];
                            });
                        }
                        catch (e) {
                            console.error(e);
                        }
                    }
                })

            }

            var idDomains = await SanteDB.resources.identityDomain.findAsync({ scope: EntityClassKeys.Material });
            $timeout(() => {
                $scope.entity = material;
                $scope.idDomains = idDomains.resource.map(d => {
                    if (d.validation) {
                        d._exampleValue = new RandExp(new RegExp(d.validation)).gen();
                    }
                    return d;
                });
            });
            return material;
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    if ($scope.$parent.scopedObject) { // don't reload
        $scope.entity = $scope.$parent.scopedObject;
        return;
    }
    else {
        initialize($stateParams.id);
    }


    // Set the active state
    $scope.setState = async function (status) {
        try {
            SanteDB.display.buttonWait("#btnSetState", true);
            await setEntityState($scope.entity.id, $scope.entity.etag, status);
            toastr.info(SanteDB.locale.getString("ui.model.material.saveSuccess"));
            $state.reload();

        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#btnSetState", false);
        }
    }

    // Save the material definition to the server
    $scope.saveMaterial = async function (form, materialToSave) {
        if (form.$invalid || form.$pristine) {
            return;
        }

        // Save the data
        try {
            SanteDB.display.buttonWait("#btnSaveMaterial", true);
            var submissionMaterial = new Material(materialToSave || $scope.editObject || $scope.entity);
            // Prepare the object for submission
            submissionMaterial = await prepareEntityForSubmission(submissionMaterial);
            deleteModelProperties(submissionMaterial);

            if (submissionMaterial.relationship && submissionMaterial.relationship.UsedEntity) {
                submissionMaterial.relationship.UsedEntity = submissionMaterial.relationship.UsedEntity.map(o => {
                    o.quantity = o.quantity || 1;
                    return o;
                });
            }
            if (submissionMaterial.extension && submissionMaterial.extension['http://santedb.org/extensions/core/targetCondition']) {
                // Correct for references
                submissionMaterial.extension['http://santedb.org/extensions/core/targetCondition'] =
                    submissionMaterial.extension['http://santedb.org/extensions/core/targetCondition'].map(ext => SanteDB.application.encodeReferenceExtension("Concept", ext.id));
            }

            if (submissionMaterial.note) {
                submissionMaterial.note = submissionMaterial.note.filter(o => o.text !== '');
            }
            submissionMaterial.id = submissionMaterial.id || SanteDB.application.newGuid();

            var submissionBundle = new Bundle({ resource: [submissionMaterial] });

            // Reverse relationships
            if (submissionMaterial.relationship) {
                var regulatedProduct = submissionMaterial.relationship.RegulatedProduct;
                if (regulatedProduct && regulatedProduct.length > 0 &&
                    regulatedProduct[0].source) {


                    submissionBundle.resource.push(new EntityRelationship({
                        id: regulatedProduct[0].id,
                        source: regulatedProduct[0].source,
                        relationshipType: EntityRelationshipTypeKeys.RegulatedProduct,
                        target: submissionMaterial.id
                    }));
                    delete (submissionMaterial.relationship.RegulatedProduct);
                }
            }

            submissionBundle = await SanteDB.resources.bundle.insertAsync(submissionBundle)
            if ($stateParams.id) {
                submissionMaterial = await initialize(submissionMaterial.id);
                //SanteDB.display.cascadeScopeObject($rootScope, ['entity', 'scopedObject'], submissionMaterial);
                toastr.success(SanteDB.locale.getString("ui.admin.material.save.success"));
            }
            else {
                $state.go("santedb-admin.data.material.view", { id: submissionMaterial.id });
            }
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#btnSaveMaterial", false);
        }
    }

}]);