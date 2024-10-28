/// <reference path="../../santedb-ui.js"/>
/// <reference path="../../../../core/js/santedb.js"/>
/// <reference path="../../../../core/js/santedb-model.js"/>
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
 */

angular.module('santedb-lib')
    /**
    * @summary Core editing of acts - and their components using their registered templates and forms
    * @memberof Angular
    * @example
    *    <act-edit 
    *        act="act_to_edit" // bi-directional binding
    *        no-add="true|false" // not-bound
    *        no-remove="true|false" // not-bound
    *        no-override="true|false" // not-bound
    *        no-header="true|false" // not bound
    *        disable-cdss="true|false" // not-bound
    *        owner-form="form_that_own" // one-way binding
    *        readonly="true|false" // not-bound 
    *    />
    */
    .directive('actEdit', ['$timeout', function ($timeout) {

        var _mode = 'edit', _noCdss = false;

        return {
            restrict: 'E',
            replace: true,
            templateUrl: './org.santedb.uicore/directives/actEdit.html',
            scope: {
                model: '=',
                ownerForm: '<',
                cdssValidationCallback: '<',
                actions: '<'
            },
            controller: ['$scope', '$rootScope', function ($scope, $rootScope) {

                var _masterTemplateList;

                async function initializeView() {
                    try {
                        var scopeArr = [];
                        if ($scope.model && $scope.model.templateModel) {
                            scopeArr.push(`:(nocase)${$scope.model.templateModel.mnemonic}`);
                        }
                        scopeArr.push(`:(nocase)${$scope.model.typeConcept}`);

                        _masterTemplateList = await SanteDB.application.getTemplateDefinitionsAsync({
                            scope: scopeArr,
                            public: true
                        });

                        $timeout(() => {
                            $scope.availableTemplates = _masterTemplateList;
                        })
                    }
                    catch (e) {
                        console.error(e);
                    }
                }

                $scope.$watch("model.id", function (n, o) {
                    if (n) {
                        initializeView();
                    }
                });

                $scope.resolveBackentryTemplate = function (templateId) {

                    var templateValue = _mode == 'edit' ? SanteDB.application.resolveTemplateBackentry(templateId) : SanteDB.application.resolveTemplateView(templateId);
                    if (templateValue == null) {
                        return "/org.santedb.uicore/partials/act/noTemplate.html"
                    }
                    return templateValue;
                }

                $scope.resolveTemplate = function (templateId) {

                    var templateValue = _mode == 'edit' ? SanteDB.application.resolveTemplateForm(templateId) : SanteDB.application.resolveTemplateView(templateId);
                    if (templateValue == null) {
                        return "/org.santedb.uicore/partials/act/noTemplate.html"
                    }
                    return templateValue;
                }

                $scope.$watch("filterTemplates", function (n, o) {
                    if (n && n != o) {
                        $scope.availableTemplates = _masterTemplateList.filter(f => f.description.toLowerCase().indexOf(n.toLowerCase()) > -1);
                    }
                    else {
                        $scope.availableTemplates = _masterTemplateList;
                    }
                })

                $scope.addItem = async function(tpl) {
                    try {
                        SanteDB.display.buttonWait('#btnAddAction', true);
                        var content = await SanteDB.application.getTemplateContentAsync(tpl.mnemonic, {
                            recordTargetId: $scope.model.participation.RecordTarget[0].player,
                            facilityId: await SanteDB.authentication.getCurrentFacilityId(),
                            userEntityId: await SanteDB.authentication.getCurrentUserEntityId()
                        });

                        // Next we want to set the performer on the action
                        content.operation = BatchOperationType.InsertInt;
                        content.id = content.id || SanteDB.application.newGuid();
                        $timeout(() => {
                            $scope.model.relationship = $scope.model.relationship || {};
                            $scope.model.relationship.HasComponent = $scope.model.relationship.HasComponent || [];
                            var ar = new ActRelationship({
                                targetModel: content,
                                target: content.id
                            });
                            $scope.model.relationship.HasComponent.push(ar);
                            $scope.currentActions.push(ar);
                        });
                    }
                    catch(e) {
                        $rootScope.errorHandler(e);
                    }
                    finally {
                        SanteDB.display.buttonWait("#btnAddAction", false);
                    }
                }

                $scope.doAction = function (action) {
                    if (action.sref) {
                        $state.go(action.sref);
                    }
                    else if (typeof (action.action) === "string") {
                        $scope.$parent[action.action]();
                    }
                    else if (action.action) {
                        action.action();
                    }
                }

                $scope.filterAction = function (action) {
                    if (action.when) {
                        return $scope.$eval(action.when, { r: $scope.model, item: $scope.model });
                    }
                    else {
                        return true;
                    }
                };
            }],
            link: function (scope, element, attrs) {

                if (attrs.noAdd === "true") {
                    $(".actAddItem", element).remove();
                }
                if (attrs.noRemove === "true") {
                    $(".actRemoveItem", element).remove();
                }
                if (attrs.noOverride === "true") {
                    $(".actProposeControl", element).remove();
                }
                if (attrs.noHeader === "true") {
                    $(".actHeader", element).remove();
                }

                // Are we viewing or editing?
                _mode = attrs.readonly === true ? 'view' : 'edit';
                _noCdss = attrs.disableCdss;

                if (scope.model && scope.model.relationship && scope.model.relationship.HasComponent) {
                    scope.currentActions = scope.model.relationship.HasComponent.filter(a => !a.targetModel.tag || a.targetModel.tag.isBackEntry[0] == 'False');
                    scope.backEntryActions = scope.model.relationship.HasComponent.filter(a => a.targetModel.tag && a.targetModel.tag.isBackEntry[0] == 'True')
                        .groupBy(
                            o => o.targetModel.templateModel.mnemonic,
                            o => o.targetModel
                        );
                }

                if (scope.model && scope.model.templateModel && scope.model.templateModel.mnemonic) {

                    if (_mode == 'edit') {
                        scope.model.$templateUrl = SanteDB.application.resolveTemplateForm(scope.model.templateModel.mnemonic);
                    }
                    else {
                        scope.model.$templateUrl = SanteDB.application.resolveTemplateView(scope.model.templateModel.mnemonic);
                    }
                }
            }
        }
    }]);
