/// <reference path="../../core/js/santedb.js" />
/*
 * Copyright (C) 2021 - 2024, SanteSuite Inc. and the SanteSuite Contributors (See NOTICE.md for full copyright notices)
 * Copyright (C) 2019 - 2021, Fyfe Software Inc. and the SanteSuite Contributors
 * Portions Copyright (C) 2015-2018 Mohawk College of Applied Arts and Technology
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you 
 * may not use this file except in compliance with the License. You may 
 * obtain a copy of the License at 
 * 
 * http://www.apache.org/licenses/LICENSE-2.0 
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the 
 * License for the specific language governing permissions and limitations under 
 * the License.
 * 
 * User: fyfej
 * Date: 2023-5-19
 */
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
    .directive('widgetTabs', ["$timeout", function ($timeout) {
        var _contextName = undefined;
        return {
            scope: {
                scopedObject: '=',
                view: '<'
            },
            restrict: 'E',
            replace: true,
            transclude: false,
            templateUrl: './org.santedb.uicore/directives/widgetTab.html',
            controller: ['$scope', '$timeout',
                function ($scope, $timeout) {
                }
            ],
            link: function (scope, element, attrs) {

                if(attrs.scopedObjectName) {
                    scope[attrs.scopedObjectName] = scope.scopedObject;
                }
                _contextName = attrs.contextName;
                if (_contextName) {
                    _contextName = _contextName.replaceAll("'", "");
                    SanteDB.application.getWidgetsAsync(_contextName, "Tab")
                        .then((widgets) => $timeout(() => scope.widgets = widgets))
                        .catch((e) => console.error(e))
                }
            }
        };
    }])
    /**
     * @method widgetTabs
     * @memberof Angular
     * @summary Binds a panel control to a series of widgets that are panel widgets
     * @description This control will render a tabl list which has a series of panels, each for widgets for the specified context
     * @param {string} contextName The name of the context for which widgets should be rendered
     * @example
     * <widget-panel context-name="'org.santedb.patient'"/>
    */
    .directive('widgetPanels', ["$timeout", function ($timeout) {
        var _view = undefined,
            _canCustomize = undefined,
            _contextName = undefined,
            _userPreferences = undefined;


        // Fetch the widgets which are valid in this context
        async function getWidgets(scope, context) {
            try {
                var widgets = await SanteDB.application.getWidgetsAsync(context, "Panel");
                var userSettings  = (_canCustomize ?
                    (scope.$root.session ? scope.$root.session.userSettings : await SanteDB.configuration.getUserSettingsAsync()) : []) 
                    || [];
                var widgetPreferences = userSettings.find(o=>o.key == "widgets") || { value:"{}" };
                _userPreferences = JSON.parse(widgetPreferences.value);
                var thisWidgetConfig = _userPreferences[_contextName];

                var renderWidgets = [];
                if(thisWidgetConfig) {
                    var tempWidgets = widgets
                        .map(w => { 
                            return { widget: w, config: thisWidgetConfig.find(c=>c.name == w.name) };
                        })
                        .filter(w=>w.config)
                        .sort((a, b) => a.config.order <= b.config.order ? -1 : 1);
                    renderWidgets = tempWidgets.map(tw => { 
                        tw.widget.size = tw.config.size || tw.widget.size;
                        tw.widget.order = tw.config.order || tw.widget.order;
                        return tw.widget;
                    });
                }
                else {
                    renderWidgets = widgets;
                }

                // Small are combined 2 per group
                var widgetGroups = [];
                renderWidgets.forEach(function (w) {
                    w.id = w.name.replaceAll(".", "_");
                    w.view = _view;
                    w.isVisible = true;
                    widgetGroups.push({ size: w.size, widgets: [w] });

                    if (scope.editForm && !w.editForm) {
                        w.editForm = scope.editForm;
                    }

                });

                $timeout(() => {
                    scope.widgetGroups = widgetGroups;
                    scope.availableWidgets = renderWidgets;
                    widgets.forEach(wd => {
                        if(!scope.availableWidgets.find(aw=>aw.name == wd.name)) {
                            scope.availableWidgets.push(wd);
                        }
                    })
                })
            }
            catch (e) {
                scope.error = e.message;
                console.error(e);
            }
        }

        return {
            scope: {
                scopedObject: '=',
                editForm: '=',
                noAlt: '<'
            },
            restrict: 'E',
            replace: true,
            transclude: false,
            templateUrl: './org.santedb.uicore/directives/widgetPanel.html',
            controller: ['$scope','$rootScope', '$state', '$transitions',
                function ($scope, $rootScope, $state, $transitions) {

                    function checkNavigateAway(e) {
                        if ($scope.widgetGroups) {
                            $scope.widgetGroups.forEach((group) => {
                                if (group.widgets) {
                                    group.widgets.forEach((panel) => {
                                        if (panel.view == 'Edit' && panel.editForm && !panel.editForm.$pristine) {
                                            e.returnValue = SanteDB.locale.getString("ui.action.abandon.confirm");
                                        }
                                    });
                                }
                            })
                        }
                        return e.returnValue;
                    }

                    window.addEventListener("beforeunload", checkNavigateAway);

                    // Transitions
                    $transitions.onBefore({}, function (transition) {
                        var navMessage = checkNavigateAway({})
                        if (navMessage && !confirm(navMessage)) {
                            $("#pageTransitioner").hide();
                            transition.abort();
                        }
                    });

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
                                try {
                                    await SanteDB.resources[$scope.scopedObject.$type.toCamelCase()].checkoutAsync($scope.scopedObject.id);
                                }
                                catch (e) {
                                    if(e.$type == "ObjectLockedException") {
                                        $rootScope.errorHandler(e);
                                        return;
                                    }
                                    else {
                                        console.warn(e.message);
                                    }
                                }
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
                        if (panel.editForm.$pristine || confirm(SanteDB.locale.getString("ui.action.abandon.confirm"))) {
                            if ($scope.scopedObject.$type) {
                                try {
                                    await SanteDB.resources[$scope.scopedObject.$type.toCamelCase()].checkinAsync($scope.scopedObject.id);
                                }
                                catch (e) {
                                    console.warn(e.message);
                                }
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
                                        formElement[0].action = "javascript:void(0);";
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

                    $scope.customizePanels = async function(form) {
                        if(form.$invalid) { return; }

                        try {
                            SanteDB.display.buttonWait("#btnSaveView", true);

                            // Get the setting object at this
                            var thisContextSettings = _userPreferences[_contextName] = [];

                            // iterate through the widgets in order and add them 
                            var order = 0;
                            $scope.availableWidgets.filter(o=>o.isVisible).forEach(w => {
                                thisContextSettings.push({
                                    name: w.name, 
                                    order: order++,
                                    size: w.size
                                });
                            });

                            await SanteDB.configuration.saveUserSettingsAsync(
                                [
                                    { "key" : "widgets", "value" : JSON.stringify(_userPreferences)} 
                                ]);
                            $rootScope.session.userSettings = await SanteDB.configuration.getUserSettingsAsync();
                            await getWidgets($scope, _contextName);
                            $("#customizeViewModal").modal("hide");
                        }
                        catch(e) {
                            $rootScope.errorHandler(e);
                        }
                        finally {
                            SanteDB.display.buttonWait("#btnSaveView", false);
                        }
                    }
                    
                }
            ],
            link: function (scope, element, attrs) {
                scope.renderSize = attrs.renderSize;
                _view = attrs.view;
                _canCustomize = attrs.canCustomize == "true";
                _contextName = attrs.contextName;
                if (_contextName) {
                    _contextName = _contextName.replaceAll("'", "");
                    getWidgets(scope, _contextName);
                }
                if (_canCustomize) {
                    $(".customizeViewBar").removeClass("d-none");
                }
            }
        };
    }]);