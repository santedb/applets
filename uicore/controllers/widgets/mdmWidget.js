angular.module('santedb').controller('MasterDataManagementController', ['$scope', '$rootScope', function ($scope, $rootScope) {
    

    // Render entity information
    $scope.renderEntityInfo = function(entity) {
        
        var retVal = "";
        if(entity.name) {
            var key = Object.keys(entity.name)[0];
            retVal += `<strong>${SanteDB.display.renderEntityName(entity.name[key])}</strong>`;
        }

        retVal += "<span class='badge badge-secondary'>";
        if(entity.identifier.MM_NHID)
            retVal += `<i class="fas fa-id-card"></i> ${SanteDB.display.renderIdentifier(entity.identifier, 'MM_NHID')}`;
        else {
            var key = Object.keys(entity.name)[0];
            retVal += `<i class="far fa-id-card"></i> ${SanteDB.display.renderIdentifier(entity.identifier, key)}`;
        }
        retVal += `</span><br/><i class='fas fa-birthday-cake'></i> ${SanteDB.display.renderDate(entity.dateOfBirth, entity.dateOfBirthPrecision)} `;

        // Deceased?
        if(retVal.deceasedDate)
            retVal += `<span class='badge badge-dark'>${SanteDB.locale.getString("ui.model.patient.deceased")}</span>`;

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
        if(entity.address) {

        }

        return retVal;
    }
  
    // Render entity information
    $scope.renderCreatedBy = function(entity) {
        return `<provenance provenance-id="'${entity.createdBy}'"  provenance-time="'${entity.creationTime}'"></provenance>`;
    }
}]);