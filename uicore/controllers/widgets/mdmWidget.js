/// <reference path="../../../core/js/santedb.js"/>
angular.module('santedb').controller('MasterDataManagementController', ['$scope', '$rootScope', function ($scope, $rootScope) {
    

    // Render entity information
    $scope.renderEntityInfo = function(entity) {
        
        var retVal = "";
        if(entity.name) {
            var key = Object.keys(entity.name)[0];
            retVal += `<strong>${SanteDB.display.renderEntityName(entity.name[key])}</strong>`;
        }

        retVal += "<span class='badge badge-secondary'>";

        var preferredDomain = $rootScope.system.config.application.setting['aa.preferred'];
        if(entity.identifier) {
            if(preferredDomain && entity.identifier[preferredDomain])
                retVal += `<i class="fas fa-id-card"></i> ${SanteDB.display.renderIdentifier(entity.identifier, preferredDomain)}`;
            else {
                var key = Object.keys(entity.identifier)[0];
                retVal += `<i class="far fa-id-card"></i> ${SanteDB.display.renderIdentifier(entity.identifier, key)}`;
            }
        }
        
        retVal += "</span>";

        if(entity.dateOfBirth)
            retVal += `<br/><i class='fas fa-birthday-cake'></i> ${SanteDB.display.renderDate(entity.dateOfBirth, entity.dateOfBirthPrecision)} `;

        // Deceased?
        if(entity.deceasedDate)
            retVal += `<span class='badge badge-dark'>${SanteDB.locale.getString("ui.model.patient.deceasedIndicator")}</span>`;

        // Gender
        switch(entity.genderConceptModel.mnemonic) {
            case 'Male':
                retVal += `<i class='fas fa-male' title="${SanteDB.display.renderConcept(entity.genderConceptModel)}"></i> ${SanteDB.display.renderConcept(entity.genderConceptModel)}`;
                break;
            case 'Female':
                retVal += `<i class='fas fa-female' title="${SanteDB.display.renderConcept(entity.genderConceptModel)}"></i> ${SanteDB.display.renderConcept(entity.genderConceptModel)}`;
                break;
            default:
                retVal += `<i class='fas fa-restroom' title="${SanteDB.display.renderConcept(entity.genderConceptModel)}"></i> ${SanteDB.display.renderConcept(entity.genderConceptModel)}`;
                break;
        }
        
        if($scope.scopedObject.relationship["MDM-RecordOfTruth"] &&
            $scope.scopedObject.relationship["MDM-RecordOfTruth"][0].target == entity.id) {
                retVal += `<span class='badge badge-success'><i class='fas fa-gavel'></i> ${SanteDB.locale.getString("ui.mdm.type.T")} </span>`
            }
        return retVal;
    }
  
    // Render entity information
    $scope.renderCreatedBy = function(entity) {
        return `<provenance provenance-id="'${entity.createdBy}'"  provenance-time="'${entity.creationTime}'"></provenance>`;
    }

    /**
     * Ignore the specified local record
     */
    $scope.ignore = async function(entity, index) {

        console.info(entity);
        if(confirm(SanteDB.locale.getString("ui.mdm.action.ignore.confirm"))) {
            
            try {
                $("#action_grp_" + index + " a i.fa-times").removeClass("fa-times").addClass("fa-circle-notch fa-spin");
                // find the relationship between this entity and the other entity
                var entityRels = await SanteDB.resources.entityRelationship.findAsync({ source: entity, target: $scope.scopedObject.id, relationshipType: "56cfb115-8207-4f89-b52e-d20dbad8f8cc", _count: 1 });
                if(entityRels.count == 0)
                    throw new Exception("KeyNotFoundException", "Could not find relationship between this entity and master entity.");
                var rel = entityRels.resource[0];

                // Delete this relationship
                await SanteDB.resources.entityRelationship.deleteAsync(rel.id);

                // Perminently ignore this 
                if(confirm(SanteDB.locale.getString("ui.mdm.action.permIgnore")))
                {
                    var currentTag = $scope.scopedObject.tag['mdm.ignore'];
                    var patchOps = [];
                    if(currentTag) {
                        currentTag += ";" + entity;
                        patchOps.push(new PatchOperation({
                            op: PatchOperationType.Remove,
                            path: "tag",
                            value: new EntityTag({ "key": "mdm.ignore" })
                        }));
                    }
                    else
                        currentTag = entity;

                    patchOps.push(new PatchOperation({
                            op: PatchOperationType.Add,
                            path: "tag",
                            value: new EntityTag({
                                key: "mdm.ignore",
                                value: currentTag
                            })
                        }));

                    var patch = new Patch({
                        appliesTo: {
                            type: $scope.scopedObject.$type,
                            id: $scope.scopedObject.id
                        },
                        change: patchOps
                    });
                    await SanteDB.resources.entity.patchAsync($scope.scopedObject.id, $scope.scopedObject.etag || $scope.scopedObject.version, patch);
                }
            }
            catch(e) {
                $rootScope.errorHandler(e);
            }
            finally {
                $("#DuplicateEntityTable table").DataTable().draw();
            }
        }

    }
}]);