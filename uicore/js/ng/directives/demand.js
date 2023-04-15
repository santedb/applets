/// <reference path="../../santedb-ui.js"/>
/// <reference path="../../../../core/js/santedb.js"/>

angular.module('santedb-lib')
/**
 * @summary Directive for demanding a policy permission in order to be able to view an element.
 */
.directive('demand', [function () {

    // Async wrapper function
    async function setElementState(element, policy) {
        try {
            var demandResult = await SanteDB.authentication.demandAsync(policy);
            switch(demandResult) {
                case SanteDB.authentication.PolicyDecision.Deny: // deny
                    $(element).attr('disabled','disabled');
                    break;
                case SanteDB.authentication.PolicyDecision.Elevate: // elevate (TODO: provide unlock elevate button)
                    break;
                case SanteDB.authentication.PolicyDecision.Grant: // grant
                    $(element).removeAttr('disabled');
                    break;
            }
        }
        catch(e) {
            console.info(`Policy demand failed - ${e}`);
            $(element).attr('disabled','disabled');
        }
    }

    return {
        restrict: 'A',
        link: function (scope, element, attrs, ngModel) {
            setElementState(element, attrs.demand);
        }
    }
}]);