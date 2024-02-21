
angular.module('santedb-lib')
    /**
     * @summary Directive for rendering out cdss debug
     */
    .directive('cdssDebug', ['$timeout', '$rootScope', function ($timeout, $rootScope) {

        return {
            scope: {
                frame: '<',
                proposals: '<',
                depth: '<',
                parentControl: '<'
            },
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: './org.santedb.admin/directives/cdssDebug.html',
            controller: [ "$scope", "$rootScope", function($scope, $rootScope) {
                $scope.activityRuntime = function(activity) {
                    if(activity.exitTime && activity.ts)  {
                        return moment(activity.exitTime).diff(activity.ts, "ms");
                    }
                }
            }],
            link: function(scope, element, attrs) {
                scope.depth = scope.depth || 0;
            }
        }
    }]);