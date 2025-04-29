/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../../core/js/santedb-model.js"/>
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
var loadedObjects = {};

angular.module("santedb").controller("MaterialWidgetController", ["$scope", "$rootScope", "$timeout", function ($scope, $rootScope, $timeout) {

    $scope.newUsedEntity = new EntityRelationship({ quantity: 1 });

    $scope.$watch("editObject.typeConcept", async function (n, o) {
        if (n && n != o) {
            try {
                var concept = await SanteDB.resources.concept.getAsync(n, 'min');

                $timeout(() => {
                    $scope.editObject.isAdministrable = concept.conceptSet.find(o => o == "ab16722f-dcf5-4f5a-9957-8f87dbb390d5") != null;
                });
            }
            catch (e) {
                console.error(e);
            }
        }
    });

    $scope.$watch((s) => s.editObject &&
        s.editObject.relationship &&
        s.editObject.relationship.UsedEntity ? s.editObject.relationship.UsedEntity.length : 0, async function (n, o) {
            if (n > 0) {
                $scope.editObject.relationship.UsedEntity.filter(o => !o.targetModel).forEach(o => {
                    SanteDB.resources.material.getAsync(o.target, 'dropdown')
                        .then(m => $timeout(() => o.targetModel = m))
                        .catch(e => console.error(e));
                });
            }
        });

    var saveMaterialInternal = SanteDB.display.getParentScopeVariable($scope, "saveMaterial");
    $scope.idDomains = SanteDB.display.getParentScopeVariable($scope, "idDomains");

    // Wrapper for underlying save material function
    $scope.saveMaterial = async function (editForm) {
        if (editForm.$invalid) return;

        // New used entity?
        if ($scope.newUsedEntity && $scope.newUsedEntity.target &&
            $scope.editObject.relationship.UsedEntity.find(e => e.target == $scope.newUsedEntity.target) == null
        ) {
            $scope.editObject.relationship.UsedEntity.push($scope.newUsedEntity);
        }
        saveMaterialInternal(editForm, $scope.editObject);
    }

}]).controller("MaterialProductController", ["$scope", "$rootScope", "$timeout", function ($scope, $rootScope, $timeout) {


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

    $scope.loadManufacturer = async function (r) {
        // Attempt to load the manufacturer
        try {
            r.relationship = r.relationship || {};
            r.relationship.ManufacturedProduct = r.relationship.ManufacturedProduct || [];
            if (!r.relationship.ManufacturedProduct.length) {
                var itm = await SanteDB.resources.organization.findAsync({ "relationship[ManufacturedProduct].target": r.id, _count: 1, _includeTotal: 'false' }, "fastview");
                if (itm.resource) {
                    r.relationship.ManufacturedProduct = [
                        {
                            holderModel: itm.resource[0]
                        }
                    ];
                }
            }
        }
        catch (e) { console.warn(e); }
        return r;
    }

    $scope.renderManufacturer = function (r) {
        if (r.relationship && r.relationship.ManufacturedProduct && r.relationship.ManufacturedProduct[0]) {
            return SanteDB.display.renderEntityName(r.relationship.ManufacturedProduct[0].holderModel.name);
        }
    }
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

    $scope.$watch("editProduct.relationship.ManufacturedProduct[0].holder", async function (n, o) {
        if (n && n != o) {
            var form = angular.element("form[name='editProductForm']").scope().editProductForm;
            if (form.tradeName.$pristine && !$scope.editProduct.version) {
                try {
                    var manufName = await SanteDB.resources.organization.getAsync(n, "min");
                    $timeout(() => $scope.editProduct.name.Assigned[0].component.$other[0] = `${$scope.scopedObject.name.Assigned[0].component.$other[0]} (${SanteDB.display.renderEntityName(manufName.name)})`);
                }
                catch (e) {
                    console.warn(e);
                }
            }
        }
    });

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

            // Remove the manufacturer assocation
            if(material.relationship && material.relationship.ManufacturedProduct) {
                submissionBundle.resource.push(new EntityRelationship({
                    id: material.relationship.ManufacturedProduct[0].id,
                    source: material.relationship.ManufacturedProduct[0].holder,
                    relationshipType: EntityRelationshipTypeKeys.ManufacturedProduct,
                    target: material.id
                }));
                delete(material.relationship.ManufacturedProduct);
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
            if(manufacturer.resource) {
                product.relationship.ManufacturedProduct = [manufacturer.resource[0]];
            }
            else {
                product.relationship.ManufacturedProduct = [];
            }
            $timeout(() => {
                $scope.editProduct = product;

                if(!product.relationship.Instance) {
                    product.relationship.Instance = [];
                }
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
                                $other: [$scope.scopedObject.name.Assigned[0].component.$other[0]]
                            }
                        }
                    ]
                },
                relationship: {
                    HasGeneralization: [
                        {
                            target: $scope.scopedObject.id,
                            quantity: 1
                        }
                    ],
                    ManufacturedProduct: [
                        {
                            holder: null,
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
}]).controller('MaterialLotController', ["$scope", "$rootScope", "$timeout", function ($scope, $rootScope, $timeout) {


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

    $scope.renderExpiry = function (r) {
        return SanteDB.display.renderDate(r.expiryDate, 'D');
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

    $scope.$watch("editLot.relationship.Instance[0].holder", async function (n, o) {
        if (n && n != o) {
            try {
                var prod = await SanteDB.resources.manufacturedMaterial.getAsync(n);
                var form = angular.element("form[name='editLotForm']").scope().editLotForm;

                // Propagate the necessary properties
                $timeout(() => {
                    copyMaterialInstance($scope.editLot, prod, prod.statusConcept, form.idGTIN.$pristine, form.tradeName.$pristine);
                });
            }
            catch (e) {
                console.warn("Error copying product details:", e);
            }
        }
    });

    $scope.saveLotMaterial = async function (form) {
        if (form.$invalid) return;

        try {
            SanteDB.display.buttonWait("#btnSaveMaterialDefn", true);
            var material = new ManufacturedMaterial(angular.copy($scope.editLot));
            await SanteDB.resources.manufacturedMaterial.insertAsync(material);
            $("#MaterialLotTable").attr("newQueryId", true);
            $("#MaterialLotTable table").DataTable().draw();
            $("#editLotModal").modal("hide");
            toastr.success(SanteDB.locale.getString("ui.admin.data.material.lot.save.success"));
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#btnSaveMaterialDefn", false);
        }
    }

    $scope.doEditLot = async function (id, idx) {
        try {
            SanteDB.display.buttonWait(`#ManufacturedMaterialedit${idx}`, true);

            var lot = await SanteDB.resources.manufacturedMaterial.getAsync(id, "full");
            var instance = await SanteDB.resources.entityRelationship.findAsync({ "target": id, "relationshipType": EntityRelationshipTypeKeys.Instance, _count: 1, _includeTotal: 'false' }, "fastview");
            lot.relationship = lot.relationship || {};
            lot.relationship.Instance = [instance.resource[0]];
            $timeout(() => {
                $scope.editLot = lot;
                $("#editLotModal").modal("show");
            });
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait(`#ManufacturedMaterialedit${idx}`, false);
        }
    }

    $scope.doDeleteLot = async function (id, idx) {
        if (confirm(SanteDB.locale.getString("ui.admin.data.material.lot.delete.confirm"))) {
            try {
                SanteDB.display.buttonWait(`#ManufacturedMaterialdelete${idx}`, true);
                await SanteDB.resources.manufacturedMaterial.deleteAsync(id);
                $("#MaterialLotTable").attr("newQueryId", true);
                $("#MaterialLotTable table").DataTable().draw();
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

    $scope.addLot = function () {

        $timeout(() => {
            var newId = SanteDB.application.newGuid();
            $scope.editLot = new ManufacturedMaterial({
                id: newId,
                determinerConcept: DeterminerKeys.Specific,
                statusConcept: StatusKeys.Active,
                identifier: {
                    GTIN: [
                        { value: "" }
                    ]
                },
                name: {
                    Assigned: [
                        {
                            component: {
                                $other: [$scope.scopedObject.name.Assigned[0].component.$other[0]]
                            }
                        }
                    ]
                },
                relationship: {
                    Instance: [
                        {
                            holder: null,
                            quantity: 1,
                            target: newId
                        }
                    ]
                }
            });

            $("#editLotModal").modal("show");
        });
    }
}]);