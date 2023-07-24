/// <reference path="../../../../core/js/santedb.js"/>
angular.module('santedb').controller('CodeSystemIndexController', ["$scope", "$rootScope", "$timeout", function ($scope, $rootScope, $timeout) {

     /**
     * @summary Render updated by
     */
     $scope.renderUpdatedBy = function (device) {
        if (device.obsoletedBy != null)
            return `<provenance provenance-id="'${device.obsoletedBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${device.obsoletedTime}'"></provenance>`;
        else if (device.updatedBy != null)
            return `<provenance provenance-id="'${device.updatedBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${device.updatedTime}'"></provenance>`;
        else if (device.createdBy != null)
            return `<provenance provenance-id="'${device.createdBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${device.creationTime}'"></provenance>`;
        return "";
    }
}]);
