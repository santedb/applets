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
angular.module('santedb').controller("OrganizationProductController", ["$scope", "$rootScope", "$timeout", function ($scope, $rootScope, $timeout) {


    async function initialize() {
        try {
            var idDomains = await SanteDB.resources.identityDomain.findAsync({ scope: EntityClassKeys.ManufacturedMaterial });
            $timeout(() => $scope.idDomains = idDomains.resource);
        }
        catch (e) {
            console.warn("Error loading ID domains for widget: ", e);
        }
    }
    initialize();

    $scope.renderName = function (r) {
        return SanteDB.display.renderEntityName(r.name);
    }

    $scope.renderQuantity = function (r) {
        // Start showing the PER instance 
        // I.E. 1 of the target = X of the parent

        var retVal = `${r.quantity} ${SanteDB.display.renderConcept(r.quantityConceptModel)} = `;
        if (r.relationship.HasGeneralization) {
            retVal += `${r.relationship.HasGeneralization[0].quantity || 1} ${SanteDB.display.renderConcept($scope.scopedObject.quantityConceptModel)}`;
        }

        return retVal;
    }

    $scope.renderGtin = function (r) {
        if (r.identifier && r.identifier.GTIN) {
            return r.identifier.GTIN[0].value;
        }
        else {
            return SanteDB.locale.getString("ui.unknown");
        }
    }

    $scope.renderTypeConcept = function (r) {
        return SanteDB.display.renderConcept(r.typeConceptModel);
    }

    $scope.renderStatusConcept = function (r) {
        return SanteDB.display.renderStatus(r.statusConcept);
    }

    $scope.renderUpdatedBy = function (r) {
        if (r.obsoletedBy != null)
            return `<provenance provenance-id="'${r.obsoletedBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${r.obsoletionTime}'"></provenance>`;
        else if (r.updatedBy != null)
            return `<provenance provenance-id="'${r.updatedBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${r.updatedTime}'"></provenance>`;
        else if (r.createdBy != null)
            return `<provenance provenance-id="'${r.createdBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${r.creationTime}'"></provenance>`;
        return "";
    }

    // Submission handler for the creation of the product material
    $scope.saveProductMaterial = async function (productMaterialForm) {
        if (productMaterialForm.$invalid) return;

        try {
            SanteDB.display.buttonWait("#btnSaveMaterialDefn", true);

            var submissionBundle = new Bundle({ resource: [] });
            var material = new ManufacturedMaterial(angular.copy($scope.editProduct));
            submissionBundle.resource.push(material);
            // Propagate to the lot numbers
            if (material.relationship.Instance) {
                material.relationship.Instance.forEach(prod => {
                    if (prod.targetModel) {
                        copyMaterialInstance(prod.targetModel, material, prod.statusConcept || StatusKeys.Active, true, true);
                        prod.target = prod.targetModel.id = prod.targetModel.id || SanteDB.application.newGuid();
                        submissionBundle.resource.push(new ManufacturedMaterial(prod.targetModel));
                        delete prod.targetModel;

                    }
                });
            }
            if (material.version) {
                material.operation = BatchOperationType.Update;
            }

            await SanteDB.resources.bundle.insertAsync(submissionBundle);
            $("#MaterialProductTable").attr("newQueryId", true);
            $("#MaterialProductTable table").DataTable().draw();
            $("#editProductModal").modal("hide");
            toastr.success(SanteDB.locale.getString("ui.admin.data.material.product.save.success"));
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#btnSaveMaterialDefn", false);
        }
    }

    $scope.doEditProduct = async function (id, idx) {
        try {
            SanteDB.display.buttonWait(`#ManufacturedMaterialedit${idx}`, true);

            var product = await SanteDB.resources.manufacturedMaterial.getAsync(id, "full");
            product.identifier = product.identifier || {};
            product.identifier.GTIN = product.identifier.GTIN || [{ value: "" }];
            var manufacturer = await SanteDB.resources.entityRelationship.findAsync({ "target": id, "relationshipType": EntityRelationshipTypeKeys.ManufacturedProduct, _count: 1, _includeTotal: 'false' }, "fastview");
            product.relationship.ManufacturedProduct = [manufacturer.resource[0]];
            $timeout(() => {
                $scope.editProduct = product;
                $("#editProductModal").modal("show");
            });
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait(`#ManufacturedMaterialedit${idx}`, false);
        }
    }

    $scope.doDeleteProduct = async function (id, idx) {
        if (confirm(SanteDB.locale.getString("ui.admin.data.material.product.delete.confirm"))) {
            try {
                SanteDB.display.buttonWait(`#ManufacturedMaterialdelete${idx}`, true);
                await SanteDB.resources.manufacturedMaterial.deleteAsync(id);
                $("#MaterialProductTable").attr("newQueryId", true);
                $("#MaterialProductTable table").DataTable().draw();
                toastr.success(SanteDB.locale.getString("ui.admin.data.material.product.delete.success"));
            }
            catch (e) {
                toastr.success(SanteDB.locale.getString("ui.admin.data.material.product.delete.error", { error: e.message }));
            }
            finally {
                SanteDB.display.buttonWait(`#ManufacturedMaterialdelete${idx}`, false);
            }
        }
    }

    $scope.$watch("editProduct.relationship.HasGeneralization[0].target", async function (n, o) {
        if (n && n != o) {
            try {
                var matl = await SanteDB.resources.material.getAsync(n, "fastview");
                $timeout(() => {
                    $scope.editProduct.typeConcept = matl.typeConcept;
                    $scope.editProduct.formConcept = matl.formConcept;
                    $scope.editProduct.isAdministrable = matl.isAdministrable;
                    $scope.editProduct.quantity = matl.quantity;
                    $scope.editProduct.quantityConcept = matl.quantityConcept;
                    $scope.editProduct.name.Assigned[0].component.$other[0] = `${matl.name.Assigned[0].component.$other[0]} (${SanteDB.display.renderEntityName($scope.scopedObject.name)})`;
                    $scope.editProduct.relationship.HasGeneralization[0].targetModel = matl;
                });
            }
            catch (e) {
                console.warn(e);
            }
        }
    });

    $scope.addProduct = function () {

        $timeout(() => {
            var newId = SanteDB.application.newGuid();
            $scope.editProduct = new ManufacturedMaterial({
                id: newId,
                determinerConcept: DeterminerKeys.DescribedQualified,
                typeConcept: $scope.scopedObject.typeConcept,
                formConcept: $scope.scopedObject.formConcept,
                isAdministrable: $scope.scopedObject.isAdministrable,
                quantity: $scope.scopedObject.quantity,
                quantityConcept: $scope.scopedObject.quantityConcept,
                statusConcept: StatusKeys.Active,
                identifier: {
                    GTIN: [{}]
                },
                name: {
                    Assigned: [
                        {
                            component: {
                                $other: []
                            }
                        }
                    ]
                },
                relationship: {
                    HasGeneralization: [
                        {
                            target: null,
                            quantity: 1
                        }
                    ],
                    ManufacturedProduct: [
                        {
                            holder: $scope.scopedObject.id,
                            target: newId
                        }
                    ],
                    Instance: [
                        {
                            targetModel: {

                            }
                        }
                    ]
                }
            });

            $("#editProductModal").modal("show");
        });
    }
}])