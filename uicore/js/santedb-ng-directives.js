
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
     * <entity-search type="Place" 
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
                case "Entity":
                    retVal += "<i class='fa fa-share-alt'></i> ";
                    break;
                case "AssigningAuthority":
                    retVal += "<i class='fa fa-id-card'></i> ";
                    break;
                default:
                    retVal += "<i class='fa fa-box'></i> ";
                    break;
            }
            retVal += "&nbsp;";


            if (selection.name != null && selection.name.OfficialRecord != null)
                retVal += SanteDB.display.renderEntityName(selection.name.OfficialRecord);
            else if (selection.name != null && selection.name.Assigned != null)
                retVal += SanteDB.display.renderEntityName(selection.name.Assigned);
            else if (selection.name != null && selection.name.$other != null)
                retVal += SanteDB.display.renderEntityName(selection.name.$other);
            else if (selection.name != null)
                retVal += selection.name;
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
                defaultResults: '='
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
                            value.forEach(function (v) {
                                api.getAsync(v)
                                    .then(function (res) {

                                        if ($(selectControl).find(`option[value=${v}]`).length == 0) {
                                            $(selectControl)[0].add(new Option(renderObject(res), v, false, true));
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
                    var modelType = attrs.model || attrs.type;
                    var filterString = attrs.filter;
                    var displayString = attrs.display;
                    var searchProperty = attrs.searchField || "name.component.value";
                    var defaultResults = attrs.default;
                    var groupString = attrs.groupBy;
                    var groupDisplayString = attrs.groupDisplay;
                    var resultProperty = attrs.resultfield || "id";
                    var filter = {}, defaultFilter = {};
                    if (filterString !== undefined)
                        filter = JSON.parse(filterString);

                    // Bind select 2 search
                    $(element).select2({
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
                            url: ((modelType == "SecurityUser" || modelType == "SecurityRole") ? "/ami/" : "/hdsi/") + modelType,
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
                                        var text = "";
                                        if (displayString) {
                                            scope = o;
                                            text = eval(displayString);
                                        }
                                        else if (o.name !== undefined) {
                                            text = renderObject(o);
                                        }
                                        o.text = o.text || text;
                                        o.id = o[resultProperty];
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
                    element.on('select2:select', function (e) {
                        var val = $(element).select2("val");
                        //e.currentTarget.options.selectedIndex = e.currentTarget.options.length - 1;
                        scope.$apply(() => ngModel.$setViewValue(val));
                    });
                    ngModel.$render = function () {
                        scope.setValue(element, modelType, ngModel.$viewValue);
                    };
                });
            }
        };
    })
    /**
     * @summary Blocks a button whenever the current principal does not have permission
     */
    .directive("demand", ['$rootScope', function($rootScope) {
        return {
            restrict: 'A',
            replace: true,
            link: function(scope, element, attrs) {
                // Ensure ID Data exists
                if(!$rootScope.session.id_data)
                    $rootScope.session.id_data = JSON.parse(atob($rootScope.session.id_token));
                if($rootScope.session.id_data.scope.indexOf(attrs.sdbDemand) == -1) {
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
                i18nPrefix: "<"
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

                $timeout(function () {

                    scope.propertyPath = attrs.propertyPath;

                    var columns = scope.properties.map(function (m) {
                        var renderer = scope.render ? scope.render[m] : null;

                        return {

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
                    columns.unshift({ data: "id", visible: false });

                    // Add buttons 
                    if (scope.itemActions && scope.itemActions.length > 0) {
                        columns.push({
                            render: function (d, t, r, m) {
                                var retVal = `<div class='btn-group' id='action_grp_${m.row}'>`;
                                scope.itemActions.forEach(function (b) {
                                    if (b.sref)
                                        retVal += `<a title="${SanteDB.locale.getString('ui.action.' + b.name)}" ui-sref="${b.sref}({ id: '${r.id}' })" class="btn ${(b.className || 'btn-default')}">`;
                                    else
                                        retVal += `<a title="${SanteDB.locale.getString('ui.action.' + b.name)}" href="" ng-click="$parent.${b.action}('${r.id}', ${m.row})" class="btn ${(b.className || 'btn-default')}">`;
                                    retVal += `<i class="${b.icon || 'fas fas-eye-open'}"></i>&nbsp;`;
                                    if(b.name)
                                        retVal += `<span class="d-md-none d-lg-inline">${SanteDB.locale.getString('ui.action.' + b.name)}</span>`;
                                    retVal += "</a>";

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
                        {
                            text: "<i class='fas fa-sync-alt'></i> " + SanteDB.locale.getString("ui.action.reload"),
                            className: "btn btn-info",
                            action: function (e, dt, node, config) {
                                dt.ajax.reload();
                            }
                        }
                    );

                    dt = $("table", element).DataTable({
                        lengthChange: false,
                        processing: true,
                        buttons: buttons,
                        serverSide: true,
                        "language": {
                            "infoFiltered": "",
                            "processing": "<i class='fa fa-circle-notch fa-spin'></i> " + SanteDB.locale.getString("ui.wait")
                        },
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
    }]);