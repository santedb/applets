/// <reference path="../../core/js/santedb.js" />

angular.module('santedb-lib')
    /**
     * @method widgetTabs
     * @memberof Angular
     * @summary Binds a tab control to a series of widgets that are tabbed widgets
     * @description This control will render a tabl list which has a series of tabs, each for widgets for the specified context
     * @param {string} contextName The name of the context for which widgets should be rendered
     * @example
     * <widget-tabs context-name="'org.santedb.patient'"/>
    */
    .directive('widgetTabs', function () {
        return {
            scope: {
                contextName: '<',
                currentTab: '=',
                scopedObject: '='
            },
            restrict: 'E',
            replace: true,
            transclude: false,
            templateUrl: './org.santedb.uicore/directives/widgetTab.html',
            controller: ['$scope', '$rootScope',
                function ($scope, $rootScope) {

                    // Fetch the widgets which are valid in this context
                    async function getWidgets(context) {
                        try {
                            $scope.widgets = await SanteDB.application.getWidgetsAsync(context, "Tab");
                            $scope.$apply();
                        }
                        catch(e){
                            $scope.error = e.message;
                            console.error(e);
                        }
                    }

                    getWidgets($scope.contextName);
                }
            ],
            link: function (scope, element, attrs) {
            }
        };
    })
    /**
     * @method widgetTabs
     * @memberof Angular
     * @summary Binds a panel control to a series of widgets that are panel widgets
     * @description This control will render a tabl list which has a series of panels, each for widgets for the specified context
     * @param {string} contextName The name of the context for which widgets should be rendered
     * @example
     * <widget-panel context-name="'org.santedb.patient'"/>
    */
   .directive('widgetPanels', function () {
    return {
        scope: {
            contextName: '<',
            currentTab: '=',
            scopedObject: '='
        },
        restrict: 'E',
        replace: true,
        transclude: false,
        templateUrl: './org.santedb.uicore/directives/widgetPanel.html',
        controller: ['$scope', '$rootScope',
            function ($scope, $rootScope) {

                // Fetch the widgets which are valid in this context
                async function getWidgets(context) {
                    try {
                        $scope.widgets = await SanteDB.application.getWidgetsAsync(context, "Panel");
                        $scope.$apply();
                    }
                    catch(e){
                        $scope.error = e.message;
                        console.error(e);
                    }
                }

                getWidgets($scope.contextName);
            }
        ],
        link: function (scope, element, attrs) {
        }
    };
});