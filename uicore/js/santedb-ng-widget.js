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
                scopedObject: '=',
                view: '<'
            },
            restrict: 'E',
            replace: true,
            transclude: false,
            templateUrl: './org.santedb.uicore/directives/widgetTab.html',
            controller: ['$scope', '$timeout',
                function ($scope, $timeout) {

                    // Fetch the widgets which are valid in this context
                    async function getWidgets(context) {
                        try {
                            var widgets = await SanteDB.application.getWidgetsAsync(context, "Tab");
                            $timeout(() => $scope.widgets = widgets);
                        }
                        catch (e) {
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
                scopedObject: '=',
                editForm: '=',
                noAlt: '<',
                view: '<'
            },
            restrict: 'E',
            replace: true,
            transclude: false,
            templateUrl: './org.santedb.uicore/directives/widgetPanel.html',
            controller: ['$scope', '$timeout', '$rootScope', '$state',
                function ($scope, $timeout, $rootScope, $state) {

                    $scope.hasView = function (panel, viewName) {
                        if (panel.views) {
                            var view = panel.views.find(o => o.type == viewName);
                            return view != null;
                        }
                    }

                    $scope.disableView = function (panel, viewName) {
                        if (panel.views) {
                            var view = panel.views.find(o => o.type == viewName);
                            if (view && view.demand && view.demand.length && view._demandSuccess === undefined) {
                                Promise.all(view.demand.map(o => SanteDB.authentication.demandAsync(o)))
                                    .then(r => {
                                        switch (r) {
                                            case SanteDB.authentication.PolicyDecision.Deny: // deny
                                                $(`#pnl${panel.id}${viewName}`).attr('disabled', 'disabled');
                                                $(`#pnl${panel.id}${viewName}`).attr('title', SanteDB.locale.getString("ui.error.policy"));
                                                break;
                                            case SanteDB.authentication.PolicyDecision.Elevate: // elevate (TODO: provide unlock elevate button)
                                            case SanteDB.authentication.PolicyDecision.Grant: // grant
                                                $(`pnl${panel.id}${viewName}`).removeAttr('disabled');
                                                $(`#pnl${panel.id}${viewName}`).removeAttr('title');
                                                break;
                                        }
                                    })
                                    .catch(r => {
                                        $(`#pnl${panel.id}${viewName}`).attr('disabled', 'disabled');
                                        $(`#pnl${panel.id}${viewName}`).attr('title', SanteDB.locale.getString("ui.error.policy"));
                                    })
                            }
                        }
                    }

                    $scope.setView = async function (panel, view) {
                        try {
                            if ($scope.scopedObject.$type && view == 'Edit') {
                                // lock the object for our user
                                await SanteDB.resources[$scope.scopedObject.$type.toCamelCase()].checkoutAsync($scope.scopedObject.id);
                                // Isolate the editing object
                                if (!$scope.$parent.editObject) {
                                    $scope.editObject = angular.copy($scope.scopedObject);
                                }
                            }
                            $timeout(() => {
                                $scope.original = angular.copy($scope.scopedObject);
                                panel.view = view;
                                $scope.altView = true;
                            });
                        }
                        catch (e) {
                            if (e.$type == "ObjectLockedException") {
                                alert(e.message);
                            }
                            else {
                                $rootScope.errorHandler(e);
                            }
                        }

                    }

                    $scope.closeView = async function (panel) {
                        if (panel.editForm.$pristine || confirm(SanteDB.locale.getString("ui.action.cancel.confirm"))) {
                            if ($scope.scopedObject.$type) {
                                await SanteDB.resources[$scope.scopedObject.$type.toCamelCase()].checkinAsync($scope.scopedObject.id);
                                delete ($scope.editObject);
                            }
                            $timeout(() => {
                                $scope.scopedObject = $scope.original;
                                delete (panel.view);
                                $scope.altView = false;

                            })
                        }
                    }

                    $scope.submitEditForm = async function (panel) {

                        if (panel.view == 'Edit') {
                            if (panel.editForm) {
                                if (panel.editForm.$valid) {
                                    $timeout(() => {
                                        var formElement = panel.editForm.$$element;
                                        var submitResult = formElement.submit();
                                        panel.view = null;
                                        $scope.altView = false;
                                    });

                                }
                            }
                            else
                                panel.view = null;
                        }
                        else {
                            panel.view = 'Edit';
                        }
                    }

                    // Fetch the widgets which are valid in this context
                    async function getWidgets(context) {
                        try {
                            var widgets = await SanteDB.application.getWidgetsAsync(context, "Panel");

                            // Small are combined 2 per group
                            var widgetGroups = [];
                            widgets.forEach(function (w) {

                                /*if(w.size == "Small") {  // combine
                                    if(cGroup == null) {
                                        cGroup = { size: "Small", widgets: [] };
                                        $scope.widgetGroups.push(cGroup);
                                    }
                                    cGroup.widgets.push(w);
                                    if(cGroup.widgets.length >= w.maxStack)
                                        cGroup = null;
                                }
                                else */
                                w.id = w.name.replaceAll(".", "_");
                                w.view = $scope.view;
                                widgetGroups.push({ size: w.size, widgets: [w] });

                                if ($scope.editForm && !w.editForm) {
                                    w.editForm = $scope.editForm;
                                }
                                if(w.editForm) {
                                    w.editForm.$$element.attr("action", "javascript:void(0);");
                                }
                            });

                            $timeout(() => {
                                $scope.widgetGroups = widgetGroups;
                            })
                        }
                        catch (e) {
                            $scope.error = e.message;
                            console.error(e);
                        }
                    }

                    getWidgets($scope.contextName);
                }
            ],
            link: function (scope, element, attrs) {
                scope.renderSize = attrs.renderSize;

            }
        };
    });