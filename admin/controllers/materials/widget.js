/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../../core/js/santedb-model.js"/>
angular.module("santedb").controller("MaterialWidgetController", ["$scope", "$rootScope", "$timeout", function($scope, $rootScope, $timeout) {

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
        s.editObject.relationship.UsedEntity ? s.editObject.relationship.UsedEntity.length : 0, async function(n, o) {
        if(n > 0) {
            $scope.editObject.relationship.UsedEntity.filter(o=>!o.targetModel).forEach(o=> {
                SanteDB.resources.material.getAsync(o.target, 'dropdown')
                    .then(m=> $timeout(() => o.targetModel = m))
                    .catch(e=>console.error(e));
            });
        }
    });

    var saveMaterialInternal = SanteDB.display.getParentScopeVariable($scope, "saveMaterial");
    $scope.idDomains = SanteDB.display.getParentScopeVariable($scope, "idDomains");

    // Wrapper for underlying save material function
    $scope.saveMaterial = async function(editForm) {
        if(editForm.$invalid) return;

        // New used entity?
        if($scope.newUsedEntity && $scope.newUsedEntity.target &&
            $scope.editObject.relationship.UsedEntity.find(e=>e.target == $scope.newUsedEntity.target) == null
        ) {
            $scope.editObject.relationship.UsedEntity.push($scope.newUsedEntity);
        } 
        saveMaterialInternal(editForm, $scope.editObject);
    }

}]).controller("MaterialProductController", ["$scope", "$rootScope", "$timeout", function($scope, $rootScope, $timeout) {

    $scope.loadManufacturer = async function(r) {
        // Attempt to load the manufacturer
        try {
            r.relationship = r.relationship || {};
            r.relationship.ManufacturedProduct = r.relationship.ManufacturedProduct || [];
            if(!r.relationship.ManufacturedProduct.length) {
                var itm = await SanteDB.resources.organization.findAsync({ "relationship[ManufacturedProduct].target" : r.target, _count: 1, _includeTotal: false }, "fastview");
                if(itm.resource) {
                    r.relationship.ManufacturedProduct = [
                        {
                            holderModel: itm.resource[0]
                        }
                    ];
                }
            }
        }
        catch(e) { console.warn(e); }
        return r;
    }

    $scope.renderManufacturer = function(r) {
        if(r.relationship && r.relationship.ManufacturedProduct) {
            return SanteDB.display.renderEntityName(r.relationship.ManufacturedProduct[0].holderModel.name);
        }
    }
    $scope.renderName = function(r) {
        return SanteDB.display.renderEntityName(r.targetModel.name);
    }

    $scope.renderQuantity = function(r) {
        // Start showing the PER instance 
        // I.E. 1 of the target = X of the parent
        var retVal = `${r.quantity || 1} ${SanteDB.display.renderConcept($scope.scopedObject.quantityConceptModel)}`;
        
        if(r.targetModel && r.targetModel.quantity) {
            retVal += `(${r.targetModel.quantity} ${SanteDB.display.renderConcept(r.targetModel.quantityConceptModel)})`;
        }
        return retVal;
    }

    $scope.renderGtin = function(r) {
        if(r.targetModel.identifier && r.targetModel.identifier.GTIN) {
            return r.targetModel.identifier.GTIN[0].value;
        }
        else {
            return SanteDB.locale.getString("ui.unknown");
        }
    }

    $scope.renderStatusConcept = function(r) {
        switch (r.targetModel.statusConcept) {
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

    $scope.renderUpdatedBy = function(r) {
        if (r.targetModel.obsoletedBy != null)
            return `<provenance provenance-id="'${r.targetModel.obsoletedBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${r.targetModel.obsoletionTime}'"></provenance>`;
        else if (r.targetModel.updatedBy != null)
            return `<provenance provenance-id="'${r.targetModel.updatedBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${r.targetModel.updatedTime}'"></provenance>`;
        else if (r.targetModel.createdBy != null)
            return `<provenance provenance-id="'${r.targetModel.createdBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${r.targetModel.creationTime}'"></provenance>`;
        return "";
    }
}]);