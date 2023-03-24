/*
 * Copyright 2015-2019 Mohawk College of Applied Arts and Technology
 * 
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
 * User: Justin Fyfe
 * Date: 2019-8-8
 */

/// <reference path="../../santedb-ui.js"/>
/// <reference path="../../../../core/js/santedb.js"/>

function erNavigateTo(resourceType, resourceId) {
    var injector = angular.injector(['ng', 'santedb']);
    var state = injector.get('state');
    SanteDB.application.callResourceViewer(resourceType, state, { $type: resourceType, id: parms });   
}

angular.module('santedb-lib')

    /**
     * @method relationshipGraph
     * @memberof Angular
     * @summary Represents a directive which renders entity relationships
     */
    .directive("relationshipGraph", ['$state', function ($state) {



        /**
         * 
         * @param {*} entity The entity being drawn
         * @param {*} entityRelationship The realtionship being drawn
         * @param {*} fallbackRelationship The fallback relationship information (if it cannot be retrieved)
         * @param {*} reverse True if the relationship is reverse (target to source)
         * @param {*} viewMode The mode of viewing the relationship (simple or advanced)
         * @returns The graph data
         */
        async function renderRelationship(entity, entityRelationship, fallbackRelationship, reverse, viewMode) {
            try {
                if (!entityRelationship)
                    return;
                if (entityRelationship && entityRelationship.source && entityRelationship.source != entity.id && entityRelationship.target == entity.id)
                    reverse = true;
                var entity = entityRelationship.targetModel;

                if (reverse) {
                    entity = await SanteDB.resources.entity.getAsync(entityRelationship.holder || entityRelationship.source);
                }
                else if (!entity || !entity.$ref && !entity.name) {
                    if (entity.classConceptModel && entity.$type != entity.classConceptModel.mnemonic) {
                        var repository = SanteDB.resources[entity.classConceptModel.mnemonic.toCamelCase()];
                        if (repository) {
                            entity = entityRelationship.targetModel = await repository.getAsync(entityRelationship.target, "full");
                        }
                    }
                    else {
                        entity = entityRelationship.targetModel = await SanteDB.resources.entity.getAsync(entityRelationship.target, "full");
                    }
                }

                if(entity.obsoletionTime) return '';
                var extraClass = "";
                if (entity && entity.statusConcept != StatusKeys.Active && entity.statusConcept != StatusKeys.New) {
                    extraClass = "text-light";
                }
                var retVal = "";
                if (entity) {

                    // Is this a patient? Then provide a link
                    var resolver = SanteDB.display.get;
                    var iconography = "fa-circle";
                    if (entity.determinerConcept == "6b1d6764-12be-42dc-a5dc-52fc275c4935") {
                        iconography = "fa-user-check";
                    }
                    else switch (entity.$type) {
                        case 'Patient':
                            iconography = "fa-user-plus";
                            break;
                        case 'Person':
                            iconography = "fa-user-minus";
                            break;
                        case 'Organization':
                            iconography = "fa-sitemap";
                            break;
                        case 'Place':
                            iconography = "fa-map-marker-alt";
                            break;
                        case 'Provider':
                            iconography = "fa-user-md";
                            break;
                    }

                    // Resolve MDM entity to proper type
                    if (entity.$type == 'Entity' && entity.classConcept == "49328452-7e30-4dcd-94cd-fd532d111578" && entity.typeConceptModel) {
                        var repository = SanteDB.resources[entity.typeConceptModel.mnemonic.toCamelCase()];
                        if (repository) {
                            entity = await repository.getAsync(entity.id, "min");
                            if (entity.$type == 'Entity') {
                                console.warn("MDM load did not work!", entity);
                            }
                        }
                    }

                    var resourceViewer = SanteDB.application.getResourceViewer(entity.$type);
                    if (resourceViewer) {
                        if (entity.name)
                            retVal += `\nrel${entity.id.substr(0, 8)}["<a target='new' class='mr-2 ${extraClass}' href='#!/nav/${entity.$type}?id=${entity.id}' title='View Record' ><i class='fas fa-fw ${iconography} mr-1'></i> ${SanteDB.display.renderEntityName(entity.name)} <sup class='text-small'><i class='fas fa-external-link-alt'></i></sup></a>"]`;
                        else if (entity.identifier)
                            retVal += `\nrel${entity.id.substr(0, 8)}["<a target='new' class='mr-2 ${extraClass}' href='#!/nav/${entity.$type}?id=${entity.id}' title='View Record'><i class='fas fa-fw ${iconography} mr-1'></i>${SanteDB.display.renderIdentifier(entity.identifier)} <sup class='text-small'><i class='fas fa-external-link-alt'></i></sup></a>"]`;
                        else 
                            retVal += `\nrel${entity.id.substr(0, 8)}["<a target='new' class=mr-2 ${extraClass}' href='#!/nav/${entity.$type}?id=${entity.id}' title='View Record'><i class='fas fa-fw ${iconography} mr-1'></i>${entity.$type} <sup class='text-small'><i class='fas fa-external-link-alt'></i></sup></a>"]`;
                    }
                    else {
                        if (entity.name)
                            retVal += `\nrel${entity.id.substr(0, 8)}["<span class='mr-2 ${extraClass}' title='Related ${entity.$type}'><i class='fas fa-fw ${iconography} mr-1'></i>${SanteDB.display.renderEntityName(entity.name)}</span>"]`;
                        else if (entity.identifier)
                            retVal += `\nrel${entity.id.substr(0, 8)}[<span class='mr-2 ${extraClass}' title='Related ${entity.$type}'><i class='fas fa-fw ${iconography} mr-1'></i>${entity.$type} ${SanteDB.display.renderIdentifier(entity.identifier)}</span>]`;
                        else 
                            retVal += `\nrel${entity.id.substr(0, 8)}[<span class='mr-2 ${extraClass}' title='Related ${entity.$type}'><i class='fas fa-fw ${iconography} mr-1'></i>${entity.$type}</span>]`;
                    }

                    var relationshipText = SanteDB.display.renderConcept(entityRelationship.relationshipTypeModel || fallbackRelationship);
                    if (entityRelationship.relationshipRoleModel) {
                        relationshipText += ` / ${SanteDB.display.renderConcept(entityRelationship.relationshipRoleModel)}`;
                    }
                    var dashType = `-- "${relationshipText}" -->`;

                    if (viewMode == "advanced") {
                        // To show physical relationships
                        if (entityRelationship.$type == 'EntityRelationshipMaster') {

                            if (entityRelationship.originalTarget != entityRelationship.target) {
                                retVal += `\nrel${entityRelationship.originalHolder.substr(0, 8)} ---- rel${entityRelationship.originalTarget.substr(0, 8)}`;
                                retVal += `\nrel${entityRelationship.originalTarget.substr(0, 8)}("<i class='fas fa-random fa-fw' title='MDM Redirected Link'></i>") ${dashType} rel${entityRelationship.target.substr(0, 8)}`;
                            }
                            else {
                                retVal += `\nrel${entityRelationship.originalHolder.substr(0, 8)} ${dashType} rel${entityRelationship.originalTarget.substr(0, 8)}`;

                            }
                            dashType = `-. <span class='mr-2'>${relationshipText}</span> .->`;
                        }
                        //else {
                        if (reverse)
                            retVal += `\nrel${entity.id.substr(0, 8)} ${dashType} root`;
                        else if (!entity.$ref)
                            retVal += `\nroot ${dashType} rel${entity.id.substr(0, 8)}`;
                        //}
                    }
                    else {
                        if (entityRelationship.$type == 'EntityRelationshipMaster') {
                            dashType = `-. <span class='mr-2'>${relationshipText}</span> .->`;
                        }
                        if (reverse)
                            retVal += `\nrel${entity.id.substr(0, 8)} ${dashType} root`;
                        else if (!entity.$ref)
                            retVal += `\nroot ${dashType} rel${entity.id.substr(0, 8)}`;
                    }
                }

                if (entity && entity.statusConcept != StatusKeys.Active && entity.statusConcept != StatusKeys.New)
                    retVal += `\nstyle rel${entity.id.substr(0, 8)} fill:#000,stroke:#f00,stroke-width:2px`;
                else if (entity && entity.determinerConcept == "6b1d6764-12be-42dc-a5dc-52fc275c4935")
                    retVal += `\nstyle rel${entity.id.substr(0, 8)} fill:#ffc,stroke:#00c,stroke-width:1px`;
                else if (reverse)
                    retVal += `\nstyle rel${entity.id.substr(0, 8)} fill:#ccf,stroke:#cc0,stroke-width:1px,stroke-dasharray: 5, 5`;
                else if (entityRelationship.$type == 'EntityRelationshipMaster') {
                    retVal += `\nstyle rel${entity.id.substr(0, 8)} fill:#fcf,stroke:#c0c,stroke-width:1px,stroke-dasharray: 5, 5`;
                }
                return retVal;
            }
            catch (e) {
                console.error(e);
                return `\n??-- ${SanteDB.display.renderConcept(entityRelationship.relationshipTypeModel || fallbackRelationship)} ---root`;
            }
        }


        /**
         * @summary Draw the relationship diagram to th especified object identifier
         * @param {*} entity The entity whose relationships should be drawn
         */
        async function drawRelationships(entity, viewData) {
            try {

                var graphDefinition = viewData.graphs[viewData.mode];
                if (!graphDefinition) {
                    graphDefinition = `graph LR\nroot(("<span class='mr-2'>${SanteDB.display.renderEntityName(entity.name)}</span>"))\nstyle root fill:#afa,stroke:#0c0,stroke-width:2px`;

                    // Root is scoped object
                    if (entity.relationship) {
                        var promises = Object.keys(entity.relationship).filter(k=>!k.startsWith('$')).map(function (k) {
                            var retVal = [];
                            if (Array.isArray(entity.relationship[k]))
                                retVal = entity.relationship[k].map(function (r) {
                                    return renderRelationship(entity, r, k, false, viewData.mode);
                                });
                            else
                                retVal = renderRelationship(entity, entity.relationship[k], k, false, viewData.mode);
                            return retVal;
                        }).flat();
                        var results = await Promise.all(promises);
                        results.filter((r) => graphDefinition.indexOf(r) == -1).forEach((r) => graphDefinition += r);
                    }

                    // reverse relationships
                    var reverseRelationships = await SanteDB.resources.entityRelationship.findAsync({ target: entity.id, _viewModel: 'reverseRelationship' });
                    if (reverseRelationships.resource) {
                        var promises = reverseRelationships.resource.map(function (r) {
                            return renderRelationship(entity, r, 'UNK', true, viewData.mode);
                        }).flat();
                        var results = await Promise.all(promises);
                        results.filter((r) => graphDefinition.indexOf(r) == -1).forEach((r) => graphDefinition += r);
                    }
                    mermaid.mermaidAPI.render(`entityNetworkDiagram${viewData._id}`, graphDefinition, (svg) => {
                        viewData.graphs[viewData.mode] = svg;

                        $(`#renderSvg${viewData._id}`).html(svg);
                    });

                }
                else {
                    $(`#renderSvg${viewData._id}`).html(graphDefinition);

                }
            }
            catch (e) {
                console.error(e);
            }
        }

        return {
            scope: {
                'entity': '=',
                'excludeRelationships': '<',
            },
            restrict: 'E',
            replace: true,
            templateUrl: './org.santedb.uicore/directives/relationshipGraph.html',
            controller: ['$scope', '$rootScope',
                function ($scope, $rootScope) {

                    var drawn = false;

                    // Redraw the entity
                    $scope.redraw = function () {

                        $(`#entityNetworkDiagram${$scope._id}`).html("<i class='fas fa-circle-notch fa-spin'></i>");
                        drawRelationships($scope.entity, $scope.viewData);
                        drawn = true;
                    }
                    // When the entity is set
                    $scope.$watch("entity", function (n, o) {
                        if (!o && n || n && n.sequence != o.sequence || n && !drawn) {
                            drawRelationships(n, $scope.viewData);
                            drawn = true;
                        }
                    })
                }],
            link: {
                pre: function (scope, element, attrs) {
                    scope.viewData = {
                        _id: SanteDB.application.newGuid().substring(0, 6),
                        mode: "simple",
                        graphs: {
                            simple: null,
                            advanced: null
                        }
                    };
                }
            }
            // controller: ['$scope', 'BreadcrumbService', function ($scope, BreadcrumbService) { BreadcrumbService.generate(); $scope.breadcrumbList = BreadcrumbService.list; }]
        };
    }]);