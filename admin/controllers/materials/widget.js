/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../../core/js/santedb-model.js"/>
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
        if (r.relationship && r.relationship.ManufacturedProduct) {
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
        if(r.relationship.HasGeneralization) {
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

    $scope.renderStatusConcept = function (r) {
        switch (r.statusConcept) {
            case StatusKeys.Active:
                return `<span class="badge badge-info"><i class="fas fa-check"></i> ${SanteDB.locale.getString('ui.state.active')}</span>`;
            case StatusKeys.Obsolete:
                return `<span class="badge badge-danger"><i class="fas fa-trash"></i> ${SanteDB.locale.getString('ui.state.obsolete')}</span>`;
            case StatusKeys.Nullified:
                return `<span class="badge badge-secondary"><i class="fas fa-eraser"></i> ${SanteDB.locale.getString('ui.state.nullified')}</span>`;
            case StatusKeys.New:
                return `<span class="badge badge-secondary"><i class="fas fa-asterisk"></i> ${SanteDB.locale.getString('ui.state.new')}</span>`;
        }
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

            if($scope.editProduct.version) {
                await SanteDB.resources.manufacturedMaterial.updateAsync($scope.editProduct.id, $scope.editProduct);
            }
            else {
                await SanteDB.resources.manufacturedMaterial.insertAsync($scope.editProduct);
            }
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

    $scope.doEditProduct = async function(id) {
        try {
            var product = await SanteDB.resources.manufacturedMaterial.getAsync(id, "full");
            product.identifier = product.identifier || {};
            product.identifier.GTIN = product.identifier.GTIN || [ { value: ""} ];
            var manufacturer = await SanteDB.resources.entityRelationship.findAsync({ "target": id, "relationshipType": EntityRelationshipTypeKeys.ManufacturedProduct, _count: 1, _includeTotal: 'false' }, "fastview");
            product.relationship.ManufacturedProduct = [ manufacturer.resource[0] ];
            $timeout(() => {
                $scope.editProduct = product;
                $("#editProductModal").modal("show");
            });
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
    }

    $scope.doDeleteProduct = async function(id) {
        if(confirm(SanteDB.locale.getString("ui.admin.data.material.product.delete.confirm"))) {
            try {
                await SanteDB.resources.manufacturedMaterial.deleteAsync(id);
                $("#MaterialProductTable").attr("newQueryId", true);
                $("#MaterialProductTable table").DataTable().draw();
                toastr.success(SanteDB.locale.getString("ui.admin.data.material.product.delete.success"));
            }
            catch(e) {
                toastr.success(SanteDB.locale.getString("ui.admin.data.material.product.delete.error", { error: e.message }));

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
                    ]
                }
            });

            $("#editProductModal").modal("show");
        });
    }
}]);