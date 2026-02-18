/// <reference path="../../santedb-ui.js"/>
/// <reference path="../../../../core/js/santedb.js"/>
/// <reference path="../../../../core/js/santedb-model.js"/>
/*
 * Copyright (C) 2021 - 2025, SanteSuite Inc. and the SanteSuite Contributors (See NOTICE.md for full copyright notices)
 * Portions Copyright (C) 2019 - 2021, Fyfe Software Inc. and the SanteSuite Contributors
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

        var _mode = 'edit', _noCdss = false, _viewModel = 'full';

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

                var _applicableTemplateList;
                var _canBackenter;
                var _templateData;
                var _patientStatusConcepts;

                async function initializeView() {
                    try {
                        var scopeArr = [];
                        if ($scope.model && $scope.model.templateModel) {
                            scopeArr.push(`:(nocase)${$scope.model.templateModel.mnemonic}`);
                        }
                        scopeArr.push(`:(nocase)${$scope.model.typeConcept}`);

                        _applicableTemplateList = await SanteDB.application.getTemplateDefinitionsAsync({
                            scope: scopeArr,
                            public: true
                        });

                        // Those which cannot be back-entered
                        _templateData = await SanteDB.application.getTemplateDefinitionsAsync();
                        _canBackenter = _templateData.filter(o => o.backEntry);

                        $("#addActionDropdown").on("shown.bs.dropdown", function () {
                            $("#txtActEditSearch").scrollTop();
                            $("#txtActEditSearch").focus();
                        })
                        // Get the status concepts
                        _patientStatusConcepts = (await SanteDB.resources.conceptSet.getAsync("b73e6dbc-890a-11f0-8959-c764088c39f9", "min"))?.concept;

                        if ($scope.model.participation?.RecordTarget) {
                            var rct = $scope.model.participation?.RecordTarget[0].playerModel;

                            $timeout(() => {
                                $scope.availableTemplates = _applicableTemplateList
                                    .filter(o => !o.guard || $scope.$eval(o.guard, { recordTarget: rct }))
                                    .sort((a, b) => a.name < b.name ? -1 : 1);
                            });
                        }
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

                $scope.getTemplateInfo = (templateId) => _templateData?.find(o => o.mnemonic == templateId || o.uuid == templateId);
                $scope.canBackEnter = (templateId) => _canBackenter?.find(o => o.mnemonic == templateId || o.uuid == templateId) !== undefined;

                $scope.getEncounter = () => $scope.model;

                $scope.nullifyItem = async function (entry, index) {
                    if (confirm(SanteDB.locale.getString("ui.action.nullify.confirm"))) {
                        try {
                            SanteDB.display.buttonWait(`#btnNullify${index}`, true);
                            var entryCopy = angular.copy(entry);
                            delete entryCopy.version;
                            delete entryCopy.sequence;

                            entryCopy.statusConcept = StatusKeys.Nullified;
                            entryCopy.participation = entryCopy.participation || {};
                            entryCopy.participation.Verifier = [];
                            entryCopy.participation.Verifier.push(new ActParticipation({
                                player: await SanteDB.authentication.getCurrentUserEntityId()
                            }));


                            if (entryCopy.tag && entryCopy.tag['emr.processed']) {
                                entryCopy.tag['emr.processed'] = ["false"];
                            }
                            // Update the data
                            entry.operation = BatchOperationType.Update;
                            await SanteDB.resources.act.updateAsync(entryCopy.id, entryCopy, null, null, true);
                            $state.reload();
                        }
                        catch (e) {
                            $rootScope.errorHandler(e);
                        }
                        finally {
                            SanteDB.display.buttonWait(`#btnNullify${index}`, false);
                        }
                    }
                }

                $scope.cancelEdit = async function () {
                    try {
                        SanteDB.display.buttonWait("#cancelAmendment", true);
                        await SanteDB.resources.act.checkinAsync($scope.editEntry.id);
                        $timeout(() => $scope.editEntry = null);
                    }
                    catch (e) {
                        $rootScope.errorHandler(e);
                    }
                    finally {
                        SanteDB.display.buttonWait("#cancelAmendment", false);

                    }
                }

                function lookupPolicy(key) {
                    return $scope.availablePolicies.find(o => o.id == key)?.oid;    
                }
                
                function createAmendmentAct(/** @type {Act} */ existingAct) {
                    var entryCopy = angular.copy(existingAct);
                    delete entryCopy.version;
                    delete entryCopy.id;
                    delete entryCopy.previousVersion;
                    delete entryCopy.sequence;
                    entryCopy.operation = BatchOperationType.Insert;
                    entryCopy.id = SanteDB.application.newGuid();
                    entryCopy.relationship = entryCopy.relationship || {};

                    // Original copy obsoleted
                    var obsoletedOldCopy = angular.copy(existingAct);

                    // The exiting operation should UPDATE the existing entry and set it to obsolete
                    obsoletedOldCopy.operation = BatchOperationType.Update;
                    obsoletedOldCopy.statusConcept = StatusKeys.Obsolete;
                    entryCopy.relationship.Replaces = [
                        new ActRelationship({
                            target: existingAct.id,
                            targetModel: obsoletedOldCopy
                        })
                    ];

                    // Erase the source and identifiers off the act's participations and relationships
                    const relationshipParse = [entryCopy.participation, entryCopy.relationship, entryCopy.identifier, entryCopy.extension].filter(o => o != null);
                    relationshipParse.forEach(relObj => {
                        Object.keys(relObj).forEach(key => {
                            relObj[key].forEach(ptcpt => {
                                ptcpt.id = SanteDB.application.newGuid();
                                ptcpt.source = entryCopy.id;
                                ptcpt.operation = BatchOperationType.Insert;
                            })
                        });
                    })

                    // For each of the components or subjects create a new act which modifies the original 
                    entryCopy.relationship.HasSubject?.forEach(hs => {
                        hs.id = SanteDB.application.newGuid();
                        hs.targetModel = createAmendmentAct(hs.targetModel);
                        hs.target = hs.targetModel.id;
                        hs.source = entryCopy.id;
                    });
                    entryCopy.relationship.HasComponent?.forEach(hs => {
                        hs.id = SanteDB.application.newGuid();
                        hs.targetModel = createAmendmentAct(hs.targetModel);
                        hs.target = hs.targetModel.id;
                        hs.source = entryCopy.id;
                    });

                    return entryCopy;
                }

                $scope.editItem = async function (entry, index) {

                    try {
                        // Attempt to lock
                        SanteDB.display.buttonWait(`#btnEdit${index}`, true);
                        await SanteDB.resources.act.checkoutAsync(entry.id);

                        var entryCopy = createAmendmentAct(entry);
                        entryCopy.participation = entryCopy.participation || {};
                        entryCopy.participation.Authororiginator = [new ActParticipation({
                            player: await SanteDB.authentication.getCurrentUserEntityId()
                        })];;
                        entryCopy.$editIndex = index;

                        $timeout(() => $scope.editEntry = entryCopy);
                    }
                    catch (e) {
                        $rootScope.errorHandler(e);
                    }
                    finally {
                        SanteDB.display.buttonWait(`#btnEdit${index}`, false);
                    }
                }

                $scope.saveAmendment = async function (form) {
                    if (form.$invalid) return;

                    try {
                        SanteDB.display.buttonWait("#saveAmendment", true);

                        // Prepare the act for submission 
                        var actSubmission = await prepareActForSubmission($scope.editEntry);
                        var submissionBundle = bundleRelatedObjects(actSubmission);
                        actSubmission = scrubModelProperties(actSubmission);

                        // Find the old entry in the visit and replace it with the new encounter
                        var oldEntry = $scope.editEntry.relationship.Replaces[0].target;
                        var visitRelationship = angular.copy($scope.model.relationship.HasComponent.find(o => o.target == oldEntry));
                        visitRelationship.operation = BatchOperationType.Delete;
                        delete (visitRelationship.targetModel);
                        submissionBundle.resource.push(visitRelationship);

                        // Add the replacement into the visit
                        submissionBundle.resource.push(new ActRelationship({
                            operation: BatchOperationType.Insert,
                            id: SanteDB.application.newGuid(),
                            classification: RelationshipClassKeys.ContainedObjectLink,
                            relationshipType: ActRelationshipTypeKeys.HasComponent,
                            source: $scope.model.id,
                            target: actSubmission.id
                        }));

                        // Submit the bundle
                        await SanteDB.resources.bundle.insertAsync(submissionBundle);
                        await SanteDB.resources.act.checkinAsync(actSubmission.id);
                        $state.reload();
                    }
                    catch (e) {
                        $rootScope.errorHandler(e);
                    }
                    finally {
                        SanteDB.display.buttonWait("#saveAmendment", false);
                    }
                }

                $scope.setPolicy = function (act, policy) {

                    if (confirm(policy ? SanteDB.locale.getString("ui.action.seal.confirm") : SanteDB.locale.getString("ui.action.unseal.confirm"))) {
                        const existingElevator = SanteDB.authentication.getElevator();
                        // change policies logic
                        async function changePolicies() {
                            
                            try {
                                if (policy) {
                                    await SanteDB.resources.act.invokeOperationAsync(act.id, "alter-policy", {
                                        cascadePolicies: true,
                                        add: [policy.oid],
                                        remove: []
                                    }, null, null, null, "application/json");
                                }
                                else {
                                    await SanteDB.resources.act.invokeOperationAsync(act.id, "alter-policy", {
                                        cascadePolicies: true,
                                        add: [],
                                        remove: act.policy.map(o => o.policyModel || lookupPolicy(o.policy))
                                    }, null, null, null, "application/json");
                                }

                                SanteDB.authentication.setElevator(null);
                                SanteDB.authentication.setElevator(existingElevator);

                                $state.reload();
                            }
                            catch (e) {
                                $rootScope.errorHandler(e);
                            }
                        }

                        // Setup the policy elevator
                        var elevator = new SanteDBElevator(changePolicies, true);
                        elevator.setCloseCallback(() => SanteDB.authentication.setElevator(existingElevator));
                        SanteDB.authentication.setElevator(null);
                        SanteDB.authentication.setElevator(elevator);
                        changePolicies();
                    }

                }

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
                    if (_mode !== 'edit' && !$scope.editEntry) {
                        return;
                    }

                    var templateValue = SanteDB.application.resolveTemplateForm(templateId);
                    if (templateValue == null) {
                        return "/org.santedb.uicore/partials/act/noTemplate.html"
                    }
                    return templateValue;
                }


                $scope.resolveView = function (templateId) {

                    var templateValue = SanteDB.application.resolveTemplateView(templateId);
                    if (templateValue == null) {
                        return "/org.santedb.uicore/partials/act/noTemplate.html"
                    }
                    return templateValue;
                }

                $scope.doFilter = function (n) {
                    if (n) {
                        $scope.availableTemplates = _applicableTemplateList.filter(f => f.name.toLowerCase().indexOf(n.toLowerCase()) > -1);
                    }
                    else {
                        $scope.availableTemplates = _applicableTemplateList;
                    }
                }

                $scope.removeItem = function (index) {
                    // Remove from the current actions

                    var itm = $scope.currentActions[index];

                    if (itm && itm.targetModel.version) {
                        itm.operation = BatchOperationType.DeleteInt;
                    }
                    else {
                        var hidx = $scope.model.relationship.HasComponent.findIndex(o => o.target == itm.target || o.targetModel.id == itm.targetModel.id);
                        $scope.model.relationship.HasComponent.splice(hidx, 1);
                        //$scope.currentActions[index] = null;
                        $scope.currentActions.splice(index, 1);
                    }
                }

                $scope.filterCurrentActions = function (templateId) {
                    return $scope.currentActions.filter(a => a.template == templateId || a.targetModel?.template == templateId).map(o => o.targetModel || o);
                }

                function markActComplete(act) {
                    act.statusConcept = StatusKeys.Completed;
                    act.moodConcept = ActMoodKeys.Eventoccurrence;
                    act.actTime = act.actTime || new Date();
                    act.relationship?.HasComponent?.filter(cmp => cmp.targetModel).forEach(cmp => markActComplete(cmp.targetModel));
                }

                $scope.markComplete = async function (index) {

                    try {
                        SanteDB.display.buttonWait(`#action_${index}complete`, true);
                        var itm = $scope.currentActions[index];
                        var userEntityId = await SanteDB.authentication.getCurrentUserEntityId();
                        var thisUser = await SanteDB.resources.userEntity.getAsync(userEntityId, "dropdown");
                        $timeout(() => {
                            itm.operation = itm.targetModel.operation = BatchOperationType.InsertOrUpdate;
                            if (itm.targetModel.tag && itm.targetModel.tag['emr.processed']) {
                                itm.targetModel.tag['emr.processed'] = ["false"];
                            }

                            markActComplete(itm.targetModel);
                            itm.targetModel.participation = itm.targetModel.participation || {};
                            itm.targetModel.participation.Performer = itm.targetModel.participation.Performer || [];

                            // Ensure that the performer doesn't already exist on this object
                            if (!itm.targetModel.participation.Performer.find(p => p.player == thisUser.id)) {
                                itm.targetModel.participation.Performer.push(new ActParticipation({
                                    player: thisUser.id,
                                    playerModel: thisUser
                                }));
                            }

                            // Indicate all sub-components as complete

                        });
                    }
                    catch (e) {
                        console.error(e);
                    }
                    finally {
                        SanteDB.display.buttonWait(`#action_${index}complete`, false);
                    }
                }

                $scope.moveHistory = function (index) {
                    try {
                        var itm = $scope.currentActions[index];
                        itm.targetModel.tag = itm.targetModel.tag || {};

                        itm.targetModel.operation = BatchOperationType.InsertOrUpdateInt;
                        itm.targetModel.moodConcept = ActMoodKeys.Eventoccurrence;
                        if (itm.targetModel.tag.isBackEntry) {
                            delete itm.targetModel.tag.isBackEntry;
                            itm.targetModel.statusConcept = StatusKeys.Active;
                        }
                        else {
                            itm.targetModel.tag.isBackEntry = [true];
                            itm.targetModel.statusConcept = StatusKeys.Completed;

                            // Relationship
                            itm.targetModel.actTime = itm.targetModel.actTime ||
                                itm.targetModel.tag?.$originalDate ? new Date(itm.targetModel.tag?.$originalDate) :
                                itm.targetModel.relationship?.Fulfills ? itm.targetModel.relationship?.Fulfills[0]?.targetModel.startTime : itm.targetModel.startTime;
                        }
                        $scope.applyVisibilityAttributes();
                    }
                    catch (e) {
                        $rootScope.errorHandler(e);
                    }
                }

                $scope.severestInterpretation = function (...interpretations) {

                    var highestInterpretationLevel = -1;
                    var retVal = null;
                    for (var interpretation of interpretations) {
                        var thisLevel = 0;
                        switch (interpretation) {
                            case "41d42abf-17ad-4144-bf97-ec3fd907f57d":
                                thisLevel = 0;
                            case "a7159ba0-a9ec-4565-95b8-ed364794c0b8": // LOW INTERPRETATION
                            case "6188f821-261f-420c-9520-0de240a05661":
                                thisLevel = 1;
                                break;
                            case "3c4d6579-7496-4b44-aac1-18a714ff7a05": // HIGH INTERPRETATION
                            case "8b553d58-6c8c-4d01-a534-83ba5780b41a":
                                thisLevel = 2;
                                break;
                        }
                        if (thisLevel >= highestInterpretationLevel) {
                            retVal = interpretation;
                            highestInterpretationLevel = thisLevel;
                        }
                    }
                    return retVal;
                }

                $scope.addItem = async function (tpl) {
                    try {
                        SanteDB.display.buttonWait('#btnAddAction', true);
                        var content = await SanteDB.application.getTemplateContentAsync(tpl.mnemonic, {
                            recordTargetId: $scope.model.participation.RecordTarget[0].player,
                            facilityId: await SanteDB.authentication.getCurrentFacilityId(),
                            userEntityId: await SanteDB.authentication.getCurrentUserEntityId()
                        }, _viewModel);

                        content.statusConcept = StatusKeys.Active;
                        // Is this a status observation?
                        if (_patientStatusConcepts.includes(content.typeConcept)) {
                            // Existing 
                            var existing = $scope.model.relationship.HasComponent.find(o => o.targetModel?.typeConcept === content.typeConcept);
                            if (existing) // Already added - so allow the user to edit
                            {
                                $timeout(() => {
                                    existing.targetModel.statusConcept = StatusKeys.Active;
                                    var firstInput = $(`#action${existing.targetModel.id} input, #action${existing.targetModel.id} select`);
                                    $('html, body').animate({
                                        scrollTop: firstInput.offset().top
                                    }, 500);
                                    firstInput?.focus();

                                });
                                return;
                            }
                        }
                        // Next we want to set the performer on the action
                        content.operation = BatchOperationType.InsertInt;
                        content.id = content.id || SanteDB.application.newGuid();
                        content._getEncounter = () => $scope.model;
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
                            content.tag.$userAdded = [true];
                            $scope.applyVisibilityAttributes();
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


            }],
            link: function (scope, element, attrs) {

                _viewModel = attrs.viewModel || 'full';
                attrs.noBackEntry = "true";
                // Are we viewing or editing?
                _mode = attrs.readonly === "true"
                    ? 'view' : 'edit';

                // Turn off actions on view only mode
                if (_mode === 'edit') {
                    SanteDB.authentication.getCurrentFacilityId().then((r) => {
                        var actLocation = scope.model.participation?.Location[0]?.player;
                        if (actLocation && actLocation != r) {
                            _mode = 'view';
                        }
                        scope.applyVisibilityAttributes();
                        $timeout(() => scope.initialized = true);
                    });
                }
                else {
                    scope.initialized = true;
                }

                scope.applyVisibilityAttributes = function () {
                    setTimeout(() => { // allow the DOM to catch up 

                        if (attrs.noAdd === "true") {
                            $(".actAddItem", element).remove();
                        }
                        else {
                            $(".actAddItem", element).removeClass("d-none");
                        }
                        if (attrs.noRemove === "true") {
                            $(".actRemoveItem", element).remove();
                        }
                        else {
                            $(".actRemoveItem", element).removeClass("d-none");
                        }
                        if (attrs.noOverride === "true") {
                            $(".actProposeControl", element).remove();
                        }
                        else {
                            $(".actProposeControl", element).removeClass("d-none");
                        }
                        if (attrs.noHeader === "true") {
                            $(".actHeader", element).remove();
                        }
                        else {
                            $(".actHeader", element).removeClass("d-none");
                        }

                        if (attrs.noBackEntry === "true") {
                            $(".actBackEntry", element).remove();
                            // $(".actMoveToHistory", element).remove();
                        }
                        else {
                            $(".actBackEntry", element).removeClass('d-none');
                            // $(".actMoveToHistory", element).removeClass('d-none');
                        }
                        $(".actMoveToHistory", element).removeClass('d-none');

                        if (_mode == "view") {
                            $(".editOnly", element).remove();
                            $(".viewOnly", element).removeClass("d-none");
                        }
                        else {
                            $(".viewOnly", element).remove();
                            $(".editOnly", element).removeClass("d-none");
                        }

                    }, 500);
                }
                scope.applyVisibilityAttributes();

                _noCdss = attrs.disableCdss;

                if (scope.model && scope.model.relationship && scope.model.relationship.HasComponent) {

                    scope.currentActions = scope.model.relationship.HasComponent.filter(a => !a.targetModel.tag || !a.targetModel.tag.isBackEntry || a.targetModel.tag.isBackEntry[0] == 'False' || attrs.noBackEntry == "true")
                        .sort((a, b) => a.targetModel.actTime < b.targetModel.actTime ? -1 : 1); // a.targetModel.classConcept < b.targetModel.classConcept ? -1 : 1);
                    scope.backEntryActions = scope.model.relationship.HasComponent.filter(a => a.targetModel.tag && a.targetModel.tag.isBackEntry && (a.targetModel.tag.isBackEntry[0] == 'True' || a.targetModel.tag.isBackEntry[0] == 'true'))
                        .groupBy(
                            o => o.targetModel.templateModel.mnemonic,
                            o => o.targetModel
                        );
                    // Bind utility functions
                    scope.model.relationship.HasComponent.forEach(comp => {
                        comp.targetModel._getEncounter = () => scope.model;
                    });

                }

                if (scope.model && scope.model.templateModel && scope.model.templateModel.mnemonic) {
                    if (_mode == 'edit') {
                        scope.model.$templateUrl = SanteDB.application.resolveTemplateForm(scope.model.templateModel.mnemonic);
                    }
                    else {
                        scope.model.$templateUrl = SanteDB.application.resolveTemplateView(scope.model.templateModel.mnemonic);
                    }

                }
                // Is there reference
                if (scope.model.relationship?.RefersTo) {
                    scope.referenceActions = scope.model.relationship.RefersTo.filter(o => o.targetModel).groupBy(
                        o => o.targetModel.templateModel.mnemonic,
                        o => o.targetModel
                    );
                }

                SanteDB.resources.securityPolicy.findAsync({ isPublic: true }).then(result => {
                    $timeout(() => {
                        scope.availablePolicies = result.resource;
                    })
                }).catch(err => console.error(err));
                // Monitor for form touches - needs to be done after initialization
                if (!scope.model.$templateUrl) {
                    setTimeout(() => {

                        $("input,select,textarea", element).each((i, e) => {
                            $(e).on("change", function (evt) {
                                var eventIndexChanged = $(evt.currentTarget).closest("[data-actindex]").attr('data-actindex');
                                if (scope.currentActions[eventIndexChanged] && scope.currentActions[eventIndexChanged].targetModel) {
                                    SanteDB.authentication.getCurrentUserEntityId().then(result => {
                                        $timeout(() => {
                                            var targetAct = scope.currentActions[eventIndexChanged].targetModel;
                                            scope.currentActions[eventIndexChanged].operation = targetAct.operation = BatchOperationType.InsertOrUpdate;
                                            if (!targetAct.tag?.isBackEntry && targetAct.version) {
                                                targetAct.statusConcept = StatusKeys.Active;
                                            }
                                        });
                                    });
                                }
                            });
                        })

                    }, 1000);
                }
            }

        }
    }]);
