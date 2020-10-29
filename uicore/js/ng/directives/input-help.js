/// <reference path="../../santedb-ui.js"/>
/// <reference path="../../../../core/js/santedb.js"/>

angular.module('santedb-lib')
/**
 * @summary Directive for rendering a table of entities
 */
.directive('inputHelp', [function () {

    return {
        restrict: 'A',
        link: function (scope, element, attrs, ngModel) {
            
            // TODO: Lookup user preferences to see if the user has disabled help
            $(element).addClass("text-muted");
            $(element).html(`<i class="fas fa-question-circle"></i> ${$(element).html()}`)

        }
    }
}]);