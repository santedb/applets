/// <reference path="../../../core/js/santedb.js"/>
angular.module('santedb').controller('ProvenanceIndexController', ["$scope", "$rootScope", "$state", "$templateCache", function ($scope, $rootScope, $state, $templateCache) {


    // Render the information for the specified object
    $scope.renderInfo = function(prov) {
        return `<provenance provenance-id="'${prov.id}'" sessionfn="$parent.sessionFunction" provenance-time="'${prov.creationTime}'"></provenance>`;
    }

    // Render the type
    $scope.renderType = function(prov) {
        if(prov.user)
            return `<i class="fas fa-user"></i> ${SanteDB.locale.getString("ui.model.securityProvenance.type.user")}`;
        else if(prov.device)
            return `<i class="fas fa-tablet"></i> ${SanteDB.locale.getString("ui.model.securityProvenance.type.device")}`;
        else
            return `<i class="fas fa-window-maximize"></i> ${SanteDB.locale.getString("ui.model.securityProvenance.type.application")}`;
    }

    
}]);
