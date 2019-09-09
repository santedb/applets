
/// <reference path="./santedb-ui.js"/>
/// <reference path="../../core/js/santedb.js"/>

angular.module('santedb-lib')
    /**
     * @method entitySearch
     * @memberof Angular
     * @summary Binds a select2 search box to the specified select input searching for the specified entities
     * @description This class is the basis for all drop-down searches in disconnected client. It is used whenever you would like to have a search inline in a form and displayed nicely
     * @param {string} value The type of object to be searched
     * @param {string} filter The additional criteria by which results should be filtered
     * @param {string} data-searchField The field which should be searched on. The default is name.component.value
     * @param {string} data-default The function which returns a list of objects which represent the default values in the search
     * @param {string} data-groupBy The property which sets the grouping for the results in the drop-down display
     * @param {string} data-groupDisplay The property on the group property which is to be displayed
     * @param {string} data-resultField The field on the result objects which contains the result
     * @example
     * <entity-search type="'Place'" 
                    class="form-control" 
                    name="subscribeFacility" 
                    ng-model="config.subscription.facility" 
                    filter='{ "statusConcept.mnemonic" : "ACTIVE" }'/>
     */
    .directive('entitySearch', function ($timeout) {

        var renderObject = function (selection) {

            if (selection.text)
                return selection.text;

            var retVal = "";
            switch (selection.$type) {
                case "UserEntity":
                case "Provider":
                case "Patient":
                    retVal += "<i class='fa fa-user'></i> ";
                    break;
                case "Material":
                case "ManufacturedMaterial":
                    retVal += "<i class='fa fa-flask'></i> ";
                    break;
                case "Place":
                    retVal += "<i class='fa fa-map-pin'></i> ";
                    break;
                case "Organization":
                    retVal += "<i class='fa fa-building'></i> ";
                    break;
                case "Entity":
                    retVal += "<i class='fa fa-share-alt'></i> ";
                    break;
                case "AssigningAuthority":
                    retVal += "<i class='fa fa-id-card'></i> ";
                    break;
                case "SecurityRole":
                case "SecurityRoleInfo":
                case "SanteDB.Core.Model.AMI.Auth.SecurityRoleInfo, SanteDB.Core.Model.AMI":
                    retVal += "<i class='fa fa-users'></i>";
                    break;
                case "SecurityUser":
                case "SecurityUserInfo":
                case "SanteDB.Core.Model.AMI.Auth.SecurityUserInfo, SanteDB.Core.Model.AMI":
                    retVal += "<i class='fa fa-user'></i>";
                    break;

                case "SecurityPolicy":
                case "SecurityPolicyInstance":
                    retVal += "<i class='fa fa-certificate'></i>";
                    break;
                default:
                    retVal += "<i class='fa fa-box'></i> ";
                    break;
            }
            retVal += "&nbsp;";

            if (selection.typeConceptModel) {
                retVal += `<span class="badge badge-info">${SanteDB.display.renderConcept(selection.typeConceptModel)}</span> `;
            }

            if (selection.name != null && selection.name.OfficialRecord != null)
                retVal += SanteDB.display.renderEntityName(selection.name.OfficialRecord);
            else if (selection.name != null && selection.name.Assigned != null)
                retVal += SanteDB.display.renderEntityName(selection.name.Assigned);
            else if (selection.name != null && selection.name.$other != null)
                retVal += SanteDB.display.renderEntityName(selection.name.$other);
            else if (selection.name != null)
                retVal += selection.name;
            else if (selection.userName)
                retVal += selection.userName;
            else if (selection.entity)
                retVal += (selection.entity.name || selection.entity.userName);
            else if (selection.element !== undefined)
                retVal += selection.element.innerText.trim();
            else if (selection.text)
                retVal += selection.text;
            if (selection.address)
                retVal += " - <small>(<i class='fa fa-map-marker'></i> " + SanteDB.display.renderEntityAddress(selection.address) + ")</small>";
            else if (selection.oid)
                retVal += " - <small>(<i class='fa fa-cogs'></i> " + selection.oid + ")</small>";
            return retVal;
        }

        return {
            scope: {
                defaultResults: '=',
                type: '<',
                display: '<',
                searchField: '<',
                defaultResults: '<',
                groupBy: '<',
                filter: '<',
                groupDisplay: '<',
                key: '<',
                selector: '<',
                valueProperty: '<'
            },
            restrict: 'E',
            require: 'ngModel',
            replace: true,
            transclude: true,
            templateUrl: './org.santedb.uicore/directives/entitySearch.html',
            controller: ['$scope', '$rootScope',
                function ($scope, $rootScope) {

                    $scope.setValue = (selectControl, resource, value) => {
                        if (!value || Array.isArray(value) && value.length == 0) {
                            $(selectControl).find('option').remove();
                            $(selectControl).trigger('change.select2');
                        }
                        else {
                            var api = SanteDB.resources[resource.toCamelCase()];

                            if (!Array.isArray(value))
                                value = [value];

                            $(selectControl).find('option[value="? undefined:undefined ?"]').remove();
                            $(selectControl).find("option[value='loading']").remove();
                            $(selectControl)[0].add(new Option(`<i class='fa fa-circle-notch fa-spin'></i> ${SanteDB.locale.getString("ui.wait")}`, "loading", true, true));

                            value.forEach(function (v) {

                                // Key selector is ID
                                if ($scope.key && $scope.key != "id") {
                                    var query = {};
                                    query[$scope.key] = v;
                                    query._viewModel = "dropdown";
                                    api.findAsync(query)
                                        .then(function (res) {
                                            $(selectControl).find("option[value='loading']").remove();

                                            // Matching item
                                            if (res.item.length == 1)
                                                if ($(selectControl).find(`option[value=${v}]`).length == 0) {
                                                    var obj = res.item[0];
                                                    if ($scope.selector)
                                                        obj = obj[$scope.selector] || obj;
                                                    $(selectControl)[0].add(new Option(renderObject(res.item[0]), v, false, true));
                                                    $(selectControl).trigger('change.select2');
                                                }

                                        });
                                }
                                else // Lookup by ID
                                    api.getAsync({ id: v, viewModel: "dropdown" })
                                        .then(function (res) {
                                            $(selectControl).find("option[value='loading']").remove();

                                            if ($(selectControl).find(`option[value=${v}]`).length == 0) {
                                                var obj = res;
                                                if ($scope.selector)
                                                    obj = obj[$scope.selector] || obj;
                                                $(selectControl)[0].add(new Option(renderObject(obj), v, false, true));
                                                $(selectControl).trigger('change.select2');
                                            }
                                        });
                            });
                        }
                    }
                }
            ],
            link: function (scope, element, attrs, ngModel) {
                $timeout(function () {
                    var modelType = scope.type;
                    var filter = scope.filter || {};
                    var displayString = scope.display;
                    var searchProperty = scope.searchField || "name.component.value";
                    var defaultResults = scope.defaultResults;
                    var groupString = scope.groupBy;
                    var groupDisplayString = scope.groupDisplay;
                    var resultProperty = scope.key || "id";
                    var selector = scope.selector;
                    var valueProperty = scope.valueProperty;

                    $(element).find('option[value="? undefined:undefined ?"]').remove();
                    // Bind select 2 search
                    $(element).select2({
                        language: {
                            searching: function () { return `<i class="fa fa-circle-notch fa-spin"></i> ${SanteDB.locale.getString("ui.search")}`; }
                        },
                        defaultResults: function () {
                            var s = scope;
                            if (defaultResults) {
                                try {
                                    return eval(defaultResults);
                                } catch (e) {

                                }
                            }
                            else {
                                return $.map($('option', element[0]), function (o) {
                                    return { "id": o.value, "text": o.innerText };
                                });
                            }
                        },
                        dataAdapter: $.fn.select2.amd.require('select2/data/extended-ajax'),
                        ajax: {
                            url: ((modelType == "SecurityUser" || modelType == "SecurityRole" || modelType == "SecurityPolicy") ? "/ami/" : "/hdsi/") + modelType,
                            dataType: 'json',
                            delay: 500,
                            method: "GET",
                            headers: {
                                "Accept": "application/json+sdb-viewmodel"
                            },
                            data: function (params) {
                                filter[searchProperty] = "~" + params.term;
                                filter["_count"] = 20;
                                filter["_offset"] = 0;
                                filter["_viewModel"] = "min";
                                return filter;
                            },
                            processResults: function (data, params) {
                                //params.page = params.page || 0;
                                var data = data.$type == "Bundle" ? data.item : data.item || data;
                                var retVal = { results: [] };

                                if (groupString == null && data !== undefined) {
                                    retVal.results = retVal.results.concat($.map(data, function (o) {

                                        if (selector && o[selector])
                                            o = o[selector];

                                        var text = "";
                                        if (displayString) {
                                            scope = o;
                                            text = eval(displayString);
                                        }
                                        else if (o.name !== undefined) {
                                            text = renderObject(o);
                                        }
                                        o.text = o.text || text;
                                        o.id = eval(`o.${resultProperty}`) || o.id;
                                        return o;
                                    }));
                                }
                                else {
                                    // Get the group string
                                    for (var itm in data) {
                                        // parent obj
                                        try {
                                            var scope = eval('data[itm].' + groupString);
                                            var groupDisplay = "";
                                            if (groupDisplayString != null)
                                                groupDisplay = eval(groupDisplayString);
                                            else
                                                groupDisplay = scope;

                                            var gidx = $.grep(retVal.results, function (e) { return e.text == groupDisplay });
                                            if (gidx.length == 0)
                                                retVal.results.push({ "text": groupDisplay, "children": [data[itm]] });
                                            else
                                                gidx[0].children.push(data[itm]);
                                        }
                                        catch (e) {
                                            retVal.results.push(data[itm]);
                                        }
                                    }
                                }
                                return retVal;
                            },
                            cache: true
                        },
                        escapeMarkup: function (markup) { return markup; }, // Format normally
                        minimumInputLength: 2,
                        templateSelection: renderObject,
                        keepSearchResults: true,
                        templateResult: renderObject
                    });

                    // On change
                    element.on('change', function (e) {
                        var val = $(element).select2("val");
                        //e.currentTarget.options.selectedIndex = e.currentTarget.options.length - 1;
                        if (valueProperty) {
                            var modelVal = {};
                            if (Array.isArray(val))
                                modelVal = val.map(function (v) {
                                    var retVal = {};
                                    retVal[valueProperty] = v;
                                    return retVal;
                                });

                            else
                                modelVal[valueProperty] = val;
                            scope.$apply(() => ngModel.$setViewValue(modelVal));

                        }
                        else
                            scope.$apply(() => ngModel.$setViewValue(val));
                    });
                    ngModel.$render = function () {
                        if (valueProperty) {
                            if (Array.isArray(ngModel.$viewValue))
                                scope.setValue(element, modelType, ngModel.$viewValue.map(function (e) { return e[valueProperty]; }));
                            else
                                scope.setValue(element, modelType, ngModel.$viewValue[valueProperty]);
                        }
                        else
                            scope.setValue(element, modelType, ngModel.$viewValue);
                    };
                });
            }
        };
    })
    /**
     * @summary Blocks a button whenever the current principal does not have permission
     */
    .directive("demand", ['$rootScope', function ($rootScope) {
        return {
            restrict: 'A',
            replace: true,
            link: function (scope, element, attrs) {
                // Ensure ID Data exists
                if (!$rootScope.session.id_data)
                    $rootScope.session.id_data = JSON.parse(atob($rootScope.session.id_token));
                if ($rootScope.session.id_data.scope.indexOf(attrs.sdbDemand) == -1) {
                    element.addClass("disabled");
                    element.attr("disabled", "disabled");
                }
            }
        }
    }])
    /**
     * @summary Directive for rendering a table of entities
     */
    .directive('entityTable', ['$timeout', '$compile', '$rootScope', '$state', function ($timeout, $compile, $rootScope, $state) {
        var dt = null;
        return {
            scope: {
                properties: "<",
                external: "<",
                defaultQuery: "<",
                itemActions: "<",
                actions: "<",
                render: "<",
                i18nPrefix: "<",
                multiSelect: "<"
            },
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: './org.santedb.uicore/directives/entityTable.html',
            controller: ['$scope', '$rootScope',
                function ($scope, $rootScope) {
                }
            ],
            link: function (scope, element, attrs, ngModel) {

                var lastQuery = "";
                var queryId = null;

                $timeout(function () {

                    scope.propertyPath = attrs.propertyPath;

                    var columns = scope.properties.map(function (m) {
                        var renderer = scope.render ? scope.render[m] : null;

                        return {
                            orderable: renderer == null,
                            data: m,
                            render: renderer ?
                                function (d, t, r) { return scope.$parent[renderer](r) } :
                                m.indexOf("Time") > -1 ?
                                    function (d, t, r) {
                                        return d ? moment(d).format(SanteDB.locale.dateFormats.second) :
                                            null;
                                    } : null
                        };
                    });

                    // Add ID
                    columns.unshift({ data: "id", visible: false });

                    // Add buttons 
                    if (scope.itemActions && scope.itemActions.length > 0) {
                        columns.push({
                            render: function (d, t, r, m) {
                                var retVal = `<div class='btn-group' id='action_grp_${m.row}'>`;
                                scope.itemActions.forEach(function (b) {

                                    if (!b.when || eval(b.when)) {
                                        if (b.sref)
                                            retVal += `<a title="${SanteDB.locale.getString('ui.action.' + b.name)}" ui-sref="${b.sref}({ id: '${r.id}' })" class="btn ${(b.className || 'btn-default')}">`;
                                        else
                                            retVal += `<a title="${SanteDB.locale.getString('ui.action.' + b.name)}" href="" ng-click="$parent.${b.action}('${r.id}', ${m.row})" class="btn ${(b.className || 'btn-default')}">`;
                                        retVal += `<i class="${b.icon || 'fas fas-eye-open'}"></i>&nbsp;`;

                                        if (b.name)
                                            retVal += `<span class="d-sm-none d-lg-inline">${SanteDB.locale.getString(b.label || 'ui.action.' + b.name)}</span>`;
                                        retVal += "</a>";
                                    }
                                });
                                return retVal + "</div>";
                            }
                        })
                    }

                    // Buttons
                    var buttons = (scope.actions || []).map(function (b) {
                        return {
                            text: `<i class="${b.icon}"></i> ` + SanteDB.locale.getString('ui.action.' + b.name),
                            className: `btn ${b.className || 'btn-default'}`,
                            action: function (e, dt, node, config) {
                                $state.transitionTo(b.sref);
                            }
                        }
                    });

                    // Add refresh button
                    buttons.push(
                       'reload'
                    );

                    // Add a show obsolete button
                    buttons.push({
                        text: "<i class='fas fa-trash'></i> " + SanteDB.locale.getString("ui.action.showDeleted"),
                        className: "btn btn-secondary",
                        action: function (e, dt, node, config) {
                            if (!scope.defaultQuery.obsoletionTime || scope.defaultQuery.obsoletionTime == 'null') {
                                scope.defaultQuery.obsoletionTime = '!null';
                                $("button.btn-info:has(i.fa-check-double)", element).removeClass("active");
                            }
                            else {
                                scope.defaultQuery.obsoletionTime = 'null';
                                $("button.btn-info:has(i.fa-check-double)", element).addClass("active");
                            }
                            dt.ajax.reload();
                        }
                    });

                    dt = $("table", element).DataTable({
                        lengthChange: false,
                        processing: true,
                        buttons: buttons,
                        serverSide: true,
                        ajax: function (data, callback, settings) {

                            var query = angular.copy(scope.defaultQuery) || {};
                            if (data.search.value.length > 0)
                                query[attrs.searchField] = `~${data.search.value}`;
                            if (data.order[0].column != 0) {
                                var colname = scope.properties[data.order[0].column - 1]; // -1 because the ID column is hidden
                                query["_orderBy"] = `${colname}:${data.order[0].dir}`;
                            }
                            if (scope.extenral)
                                query["_extern"] = true;

                            var thisQuery = JSON.stringify(query);
                            if (lastQuery != thisQuery || element.attr("newQuery") == "true") {
                                lastQuery = thisQuery;
                                queryId = SanteDB.application.newGuid();
                                element.attr("newQuery", false);
                            }

                            query["_queryId"] = queryId;
                            query["_count"] = data.length;
                            query["_offset"] = data.start;

                            SanteDB.resources[attrs.type.toCamelCase()].findAsync(query)
                                .then(function (res) {
                                    callback({
                                        data: res.item.map(function (item) {
                                            if (scope.propertyPath)
                                                return item[scope.propertyPath];
                                            else
                                                return item;
                                        }),
                                        recordsTotal: undefined,
                                        recordsFiltered: res.totalResults || res.size
                                    });
                                })
                                .catch(function (err) { $rootScope.errorHandler(err) });
                        },
                        createdRow: function (r, d, i) {
                            $compile(angular.element(r).contents())(scope);
                            scope.$digest()
                        },
                        columns: columns
                    });

                    var bindButtons = function () {
                        dt.buttons().container().appendTo($('.dataTables_wrapper .col-md-6:eq(0)', element));
                        if (dt.buttons().container().length == 0)
                            $timeout(bindButtons, 100);
                    };
                    bindButtons();
                });
            }
        };
    }])
    /**
     * @method breadcrumbs
     * @memberof Angular
     * @summary Represents a directive which gathers breadcrumbs
     */
    .directive("breadcrumbs", ['breadcrumbService', function (breadcrumbService) {
        return {
            restrict: 'E',
            replace: true,
            priority: 100,
            templateUrl: './org.santedb.uicore/directives/breadcrumb.html',
            link: {
                pre: function (scope, element, attrs) {
                    breadcrumbService.generate();
                    scope.breadcrumbs = breadcrumbService.list;
                    breadcrumbService.change = () => scope.breadcrumbs = breadcrumbService.list;
                }
            }
            // controller: ['$scope', 'BreadcrumbService', function ($scope, BreadcrumbService) { BreadcrumbService.generate(); $scope.breadcrumbList = BreadcrumbService.list; }]
        };
    }])
    /**
     * @method inputCopyButton
     * @memberof Angular
     * @summary Creates an input button with an easy copy button
     * @param {string} source The source copy
     */
    .directive("inputCopyButton", function () {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: './org.santedb.uicore/directives/inputCopy.html',
            scope: {
                source: '='
            },
            controller: ["$scope", function ($scope) {
                $scope.copyInput = function () {
                    if (navigator.clipboard)
                        navigator.clipboard.writeText($scope.source);

                }
            }]
        }
    })
    /**
     * @method tagInput
     * @memberof Angular
     * @summary Creates a tagged input
     */
    .directive("tagInput", function () {
        return {
            require: 'ngModel',
            restrict: 'E',
            replace: true,
            templateUrl: './org.santedb.uicore/directives/tagInput.html',
            scope: {

            },
            link: function (scope, element, attrs, ngModel) {

                // Parsers
                ngModel.$parsers.unshift(function (viewValue) {
                    if (Array.isArray(viewValue))
                        return viewValue.join(",")
                    return viewValue.split(",");
                });
                ngModel.$formatters.unshift(function (viewValue) {
                    if (viewValue)
                        return String(viewValue).split(',');
                });

                // Token field initialization
                $(element).tokenfield({
                    createTokensOnBlur: true,
                    delimiter: [',', ' ']
                });

                ngModel.$render = function () {
                    var viewValue = ngModel.$viewValue;
                    if (Array.isArray(viewValue))
                        $(element).tokenfield('setTokens', viewValue);
                    else if (viewValue)
                        $(element).tokenfield('setTokens', viewValue.split(','));
                    //$(element).trigger('change');
                };
            }
        }
    })
    /**
     * @method provenance
     * @memberof Angular
     * @summary Renders a provenance info box
     */
    .directive("provenance", ['$timeout', function ($timeout) {

        var alreadyFetching = [];
        var uiqueId = 0;
        return {
            restrict: 'E',
            replace: true,
            templateUrl: './org.santedb.uicore/directives/provenance.html',
            scope: {
                provenanceId: '<',
                provenanceTime: '<',
                sessionfn: "<"
            },
            link: function (scope, element, attrs) {


                if (alreadyFetching.indexOf(scope.provenanceId) == -1) // Not yet fetching
                {
                    scope.isLoading = true;
                    alreadyFetching.push(scope.provenanceId);

                    // Fetch provenance
                    SanteDB.resources.securityProvenance.getAsync(scope.provenanceId)
                        .then(function (provData) {
                            alreadyFetching.splice(alreadyFetching.indexOf(provData.id), 1);
                            scope.isLoading = false;
                            scope.provData = provData;

                            // Construct a popover of extra info
                            var extraInfo = "";
                            if (provData.applicationModel != null)
                                extraInfo += `<b><i class='fas fa-window-maximize'></i> ${SanteDB.locale.getString('ui.provenance.application')}:</b> ${SanteDB.locale.getString(provData.applicationModel.name)}`;
                            if (scope.provenanceTime)
                                extraInfo += `<br/><b><i class='fas fa-clock'></i> ${SanteDB.locale.getString('ui.provenance.timestamp')}:</b>  ${moment(scope.provenanceTime).format(SanteDB.locale.dateFormats.second)}`;
                            if (provData.session)
                                extraInfo += `<br/><b><i class='fas fa-asterisk'></i>  ${SanteDB.locale.getString('ui.provenance.session')}:</b> ${provData.session.substring(0, 8)}`;


                            scope.$apply();
                            $timeout(function () {
                                $('button:first', element).attr('data-content', extraInfo);
                                $('button:first', element).popover({ html: true });
                            });

                            // Set the scope of all elements
                            $(`div.prv_${scope.provenanceId}`).each(function (i, e) {
                                if (e == $(element)[0]) return;
                                $(e).removeClass(`prv_${scope.provenanceId}`);

                                var sscope = angular.element(e).isolateScope();
                                sscope.provData = provData;
                                sscope.isLoading = false;
                                sscope.$apply();
                                $timeout(function () {
                                    $('button:first', e).attr('data-content', extraInfo);
                                    $('button:first', e).popover({ html: true });
                                });

                            });


                        }).catch(function (e) {
                            alreadyFetching.splice(alreadyFetching.indexOf(scope.provenanceId), 1);
                            scope.isLoading = false;
                            scope.error = true;
                        })
                }
                else {
                    scope.isLoading = true;
                    $(element).addClass(`prv_${scope.provenanceId}`);
                }
            }
        }
    }])
    /**
     * @summary Security policy instance editor
     * @memberof Angular
     * @method entityPolicyAdmin
     */
    .directive('entityPolicyAdmin', ['$timeout', function ($timeout) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: './org.santedb.uicore/directives/policyAdmin.html',
            scope: {
                securable: '=',
                policy: '='
            },
            controller: ['$scope', '$rootScope', function ($scope, $rootScope) {

                $scope.deletePolicy = function (index) {

                    
                    if (confirm(SanteDB.locale.getString("ui.confirm.delete"))) {
                        var pol = $scope.policy[index];
                        pol.exec = 'deleting';
                        SanteDB.resources.securityPolicy.findAsync({ oid: pol.oid, _count: 1 })
                            .then(function (res) {
                                pol = res.item[0];
                                pol.exec = 'deleting';
                                var resource = SanteDB.resources[$scope.securable.$type.toCamelCase()];
                                if (resource == null)
                                    return;
                                resource.removeAssociatedAsync($scope.securable.id, "policy", pol.id)
                                    .then(function (d) {
                                        $scope.policy.splice(index, 1);
                                        delete (pol.exec);
                                        $scope.$apply();
                                    })
                                    .catch(function (e) {
                                        delete (pol.exec);
                                        $rootScope.errorHandler(e);
                                    });
                            }).catch(function (e) {
                                delete (pol.exec);
                                $rootScope.errorHandler(e);
                            });
                    }
                }

                // Mark grant as dirty
                $scope.updateGrant = function (index) {

                    var pol = $scope.policy[index];
                    pol.exec = 'granting';
                    SanteDB.resources.securityPolicy.findAsync({ oid: pol.oid, _count: 1 })
                        .then(function (res) {
                            var g = pol.grant;
                            pol = res.item[0];
                            pol.grant = g;
                            pol.exec = 'granting';
                            pol.$type = 'SecurityPolicyInfo';

                            var resource = SanteDB.resources[$scope.securable.$type.toCamelCase()];
                            if (resource == null)
                                return;
                            resource.addAssociatedAsync($scope.securable.id, "policy", pol)
                                .then(function (d) {
                                    $scope.policy[index] = d;
                                    $scope.$apply();
                                })
                                .catch(function (e) {
                                    delete (pol.exec);
                                    $rootScope.errorHandler(e);
                                });
                        }).catch(function (e) {
                            delete (pol.exec);
                            $rootScope.errorHandler(e);
                        });

                }

                // Add a a new policy to the group
                $scope.addPolicy = function () {

                    $scope.newPolicy.exec = 'adding';
                    SanteDB.resources.securityPolicy.getAsync($scope.newPolicy.id)
                        .then(function (pol) {
                            pol.$type = 'SecurityPolicyInfo';
                            pol.grant = 'Grant';
                            var resource = SanteDB.resources[$scope.securable.$type.toCamelCase()];
                            if (resource == null)
                                return;
                            resource.addAssociatedAsync($scope.securable.id, "policy", pol)
                                .then(function (d) {
                                    $scope.policy.push(d);
                                    delete ($scope.newPolicy);
                                    $scope.$apply();
                                })
                                .catch(function (e) {
                                    delete ($scope.newPolicy);
                                    $rootScope.errorHandler(e);
                                });
                        })
                        .catch(function (e) {
                            delete ($scope.newPolicy);
                            $rootScope.errorHandler(e);
                        });
                }
            }],
            link: function (scope, element, attrs) {


                var dt = null;
                // Create datatable
                scope.$watch(function (s) { return (s.policy || []).length; }, function (n, o) {
                    if (n && !dt) {
                        dt = $('table', element).DataTable({
                            bLengthChange: false,
                            searching: false,
                            serverSide: false,
                            columnDefs: [
                                {
                                    orderable: false,
                                    targets: [0, 1, 2]
                                }
                            ],
                            buttons: [
                                'copy'
                            ]
                        });


                        // Bind buttons
                        var bindButtons = function () {
                            dt.buttons().container().appendTo($('.col-md-6:eq(1)', dt.table().container()));
                            if (dt.buttons().container().length == 0)
                                $timeout(bindButtons, 100);
                            else {
                                $("#addPolicy", element).appendTo($('.col-md-6:eq(0)', dt.table().container()));
                            }
                        };
                        bindButtons();
                    }
                });


            }
        }
    }]);
;