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
            controller: ['$scope', '$rootScope', '$state', function ($scope, $rootScope, $state) {

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

                $scope.loadReasonConcept = async function (entry) {
                    if (entry && entry._reasonConcept != entry.reasonConcept) {
                        entry._reasonConcept = entry.reasonConcept;
                        try {
                            if (entry.isNegated) {
                                var concept = await SanteDB.resources.concept.getAsync(entry.reasonConcept, "fastview");
                                $timeout(() => {
                                    entry.reasonConceptModel = concept;
                                });
                            }
                            else {
                                delete entry.reasonConcept;
                                delete entry.reasonConceptModel;
                            }
                        }
                        catch (e) {
                            console.warn(e);
                        }
                    }
                }
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

                $scope.doFilter = function (n) {
                    if (n) {
                        $scope.availableTemplates = _masterTemplateList.filter(f => f.name.toLowerCase().indexOf(n.toLowerCase()) > -1);
                    }
                    else {
                        $scope.availableTemplates = _masterTemplateList;
                    }
                }

                $scope.removeItem = function (index) {
                    // Remove from the current actions

                    var itm = $scope.currentActions[index];

                    if (itm && itm.targetModel.version) {
                        itm.operation = BatchOperationType.DeleteInt;
                    }
                    else {
                        var hidx = $scope.model.relationship.HasComponent.indexOf(itm);
                        $scope.model.relationship.HasComponent.splice(hidx, 1);
                        $scope.currentActions.splice(index, 1);
                    }
                }

                $scope.markComplete = function (index) {
                    var itm = $scope.currentActions[index];
                    itm.operation = itm.targetModel.operation = BatchOperationType.InsertOrUpdate;
                }
                $scope.moveHistory = function (index) {
                    if (confirm(SanteDB.locale.getString("ui.model.act.tag.backEntry.confirm"))) {
                        try {
                            var itm = $scope.currentActions[index];
                            var tpl = itm.targetModel.templateModel.mnemonic;
                            var histEntry = $scope.backEntryActions[tpl] || [];
                            histEntry.push(itm);
                            itm.targetModel.tag = itm.targetModel.tag || {};
                            itm.targetModel.tag.isBackEntry = [true];
                            $scope.removeItem(index);
                        }
                        catch (e) {
                            $rootScope.errorHandler(e);
                        }
                    }
                }

                $scope.addItem = async function (tpl) {
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
                            content.tag = content.tag || {};
                            content.tag.userAdded = [true];
                        });
                    }
                    catch (e) {
                        $rootScope.errorHandler(e);
                    }
                    finally {
                        SanteDB.display.buttonWait("#btnAddAction", false);
                    }
                }

                $scope.doAction = function (action) {
                    if (action.sref) {
                        $state.go(action.sref, { id: $scope.model.id });
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

                function flagDataUpdated(index) {

                }

            }],
            link: function (scope, element, attrs) {

                // Are we viewing or editing?
                _mode = attrs.readonly === "true" ? 'view' : 'edit';
                setTimeout(() => { // allow the DOM to catch up 

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
                    if (attrs.noBackEntry === "true") {
                        $(".actBackEntry", element).remove();
                    }
                    if (_mode == "view") {
                        $(".editOnly", element).remove();
                    }
                    else {
                        $(".viewOnly", element).remove();
                    }
                }, 500);


                // Monitor for form touches - needs to be done after initialization
                setTimeout(() => {

                    $("input", element).each((i, e) => {
                        $(e).on("blur", function (evt) {
                            var eventIndexChanged = $(evt.currentTarget).closest("[data-actindex]").attr('data-actindex');
                            if (scope.currentActions[eventIndexChanged] && scope.currentActions[eventIndexChanged].targetModel) {
                                SanteDB.authentication.getCurrentUserEntityId().then(result => {
                                    var targetAct = scope.currentActions[eventIndexChanged].targetModel;
                                    scope.currentActions[eventIndexChanged].operation = targetAct.operation = BatchOperationType.InsertOrUpdate;
                                });
                            }
                        });
                    })

                }, 1000);

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
