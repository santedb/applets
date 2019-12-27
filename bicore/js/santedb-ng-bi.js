/*
 * Portions Copyright 2015-2019 Mohawk College of Applied Arts and Technology
 * Portions Copyright 2019-2019 SanteSuite Contributors (See NOTICE)
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
 * Date: 2019-12-10
 */

/// <reference path="../../uicore/js/santedb-ui.js"/>
/// <reference path="../../core/js/santedb.js"/>
/// <reference path="./santedb-bi.js"/>

angular.module('santedb-lib')
    /**
     * @method reportParameter
     * @memberof Angular
     * @summary Renders a single report parameter
     */
    .directive('reportParameter', function () {

        var _correctValue = function (value, type) {
            switch (type) {
                case "Date":
                    return moment(value);
                default:
                    return value;
            }
        }

        return {
            scope: {
                parameter: "<",
                values: "="
            },
            restrict: "E",
            replace: true,
            transclude: true,
            templateUrl: "/org.santedb.bicore/directives/reportParameter.html",
            controller: ['$scope', '$rootScope', function ($scope, $rootScope) {
            }],
            link: function (scope, element, attrs) {

                scope.parameter.value = scope.values[scope.parameter.name] = _correctValue(scope.values[scope.parameter.name]);
            }
        }
    })
    /** 
     * @method report
     * @memberof Angular
     * @summary Renders report with input parameters
     */
    .directive('report', ['$rootScope', '$timeout', '$compile', function ($rootScope, $timeout, $compile) {
        return {
            scope: {
                id: "=",
                parameters: "=",
                view: "="
            },
            restrict: "E",
            replace: true,
            transclude: false,
            templateUrl: "/org.santedb.bicore/directives/report.html",
            controller: ['$scope', '$rootScope', function ($scope, $rootScope) {

                $scope.updateParameterValues = function(form) {

                    // TODO: Validation

                    // Select the view
                    if ($scope.view)
                        $(`#${$scope.htmlId}_${$scope.view}_tab a`).click();
                    else
                        $(`#${$scope.htmlId}_${$scope.report.views[0].name}_tab a`).click();
                }

            }],
            link: function (scope, element, attrs) {

                if (scope.report == null) {
                    SanteDBBi.resources.report.getAsync(scope.id)
                        .then(function (report) {
                            // Process the parameters from the result
                            var parameters = [];
                            report.dataSources.forEach(function (r) {
                                if (r.query)
                                    r.query.parameters.forEach(function (p) {
                                        if (parameters.find(function (ep) { ep.name == p.name }) == null) {
                                            p.value = scope.parameters[p.name];
                                            parameters.push(p);
                                        }
                                    });
                                else if (r.parameters)
                                    r.parameters.forEach(function (p) {
                                        if (parameters.find(function (ep) { ep.name == p.name }) == null) {
                                            p.value = scope.parameters[p.name];
                                            parameters.push(p);
                                        }
                                    });
                            });

                            scope.htmlId = scope.id.replace(/\./g, "");
                            scope.report = report;
                            scope.report.parameterDefinitions = parameters;

                            scope.$apply();


                            // Hack: We use dynamic tabs so we have to wait 
                            $("li.nav-item", element).on("shown.bs.tab", function (o, e) {
                                var targetElementId = ($("a:first", o.currentTarget).attr("data-target"));
                                var targetElement = $(`${targetElementId} div`);
                                if (!targetElement.hasClass("container-fluid")) {
                                    targetElement.html('<report-view id="id" view="viewDefinition.name" parameters="parameters"/>');
                                    $compile($(targetElement))(angular.element(targetElement).scope());
                                }
                            });
                            $("li.nav-item", element).on("hidden.bs.tab", function (o, e) {
                                var targetElementId = ($("a:first", o.currentTarget).attr("data-target"));
                                var targetElement = $(`${targetElementId} div`);
                                if (!targetElement.hasClass("container-fluid"))
                                    targetElement.html('');
                            });

                        
                        })
                        .catch($rootScope.errorHandler)
                }

            }
        }
    }])
    /** 
     * @method reportView
     * @memberof Angular
     * @summary Renders the specified report with the specified parameters
     * @description This function is the basis for rendering report views from SanteDB
     */
    .directive('reportView', ['$compile', '$rootScope', function ($compile, $rootScope) {

        return {
            scope: {
                id: "<",
                parameters: "<",
                view: "<"
            },
            restrict: "E",
            replace: true,
            transclude: false,
            template: "<div></div>",
            controller: ['$scope', '$rootScope', function ($scope, $rootScope) {
            }],
            link: function (scope, element, attrs) {

                var setReportContent = function (content, compile) {
                    $(element).html(content);
                    if (compile)
                        $compile($(element))(scope);
                };

                var hasRendered = false;

                // Report rendering function
                scope.renderReport = function (n, o) {
                    if (scope.id &&
                        scope.view &&
                        !scope.isRendering) {
                            hasRendered = true;
                            scope.parameters = scope.parameters || {};
                        setReportContent(`<i class='fas fa-circle-notch fa-spin'></i> ${SanteDB.locale.getString("ui.wait")}`, false);
                        scope.isRendering = true;
                        SanteDBBi.renderReportAsync(scope.id, scope.view, "html", scope.parameters)
                            .then(function (d) {
                                scope.isRendering = false;
                                setReportContent(d, true);
                            })
                            .catch(function(e) {
                                var cause = e;
                                while(cause.cause)
                                    cause = cause.cause;
                                scope.isRendering = false;
                                setReportContent(`<div class='alert alert-info'><i class="fas fa-exclamation-triangle"></i> ${SanteDB.locale.getString(cause.message)}</div>`, true);
                            });
                    }
                }

                scope.renderReport(null, null);
                scope.$watch("id", function(n, o) {
                    if(n && (o != n || !hasRendered)) {
                        
                        scope.renderReport(n, o);
                    }
                });
            }
        }
    }])
    /**
     * @method chart
     * @memberof Angular
     * @summary Binds a ChartJS chart to the control
     * @description This function is the basis for rendering a chartjs chart 
     */
    .directive('chart', function () {

        var randomColor = function (alpha, context) {

            if(isNaN(context)) {
                var index = context.dataIndex;
                var value = context.dataset.data[index];
                if (value < 0) // -ve values in red
                    return `rgba(220, 66, 66, ${alpha})`;
            }
            else 
                index = context;
    
            switch (index % 9) {
                case 0:
                    return `rgba(14,54,124, ${alpha})`;
                case 1:
                    return `rgba(65,200,240, ${alpha})`;
                case 2:
                    return `rgba(251,162,87, ${alpha})`;
                case 3:
                    return `rgba(68,49,51, ${alpha})`;
                case 4:
                    return `rgba(171,52,52, ${alpha})`;
                case 5:
                    return `rgba(208,107,38, ${alpha})`;
                case 6:
                    return `rgba(51,8,121, ${alpha})`;
                case 7:
                    return `rgba(,100,75, ${alpha})`;
                case 8:
                    return `rgba(15,76,129, ${alpha})`;
                default:
                    return `rgba(11,81,92, ${alpha})`;
            }
        };

        return {
            scope: {
                type: "<",
                data: "=",
                labels: "<",
                legend: "<",
                title: "<",
                axis: "<"
            },
            restrict: 'E',
            replace: true,
            transclude: true,
            template: '<canvas width="400" height="400"></canvas>',
            controller: ['$scope',
                function ($scope) {
                }
            ],
            link: function (scope, element, attrs, ngModel) {

                if (!Array.isArray(scope.data))
                    scope.data = [scope.data];

                for (var i in scope.data) {
                    if(scope.type == "line" || scope.type == "radar") {
                        scope.data[i].backgroundColor = scope.data[i].backgroundColor || randomColor(0.5, parseInt(i));
                        scope.data[i].borderColor = scope.data[i].borderColor || randomColor(1, parseInt(i));
                        scope.data[i].pointBackgroundColor = 'rgba(0,0,0,0.1)';
                        scope.data[i].pointBorderColor = 'rgba(0,0,0,0.1)';
                    }
                    else {
                        scope.data[i].backgroundColor = scope.data[i].backgroundColor || randomColor.bind(null, 0.5);
                        scope.data[i].borderColor = scope.data[i].borderColor || randomColor.bind(null,1);
                    }
                    scope.data[i].borderWidth = 1;
                }

                if(scope.type == 'bar' || scope.type == 'line') {
                    var scale = {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            }
                        }]
                    };
                    if(scope.axis)
                        scale.xAxes = scope.axis;
                }

                // Construct the chart
                scope.chart = new Chart(element[0].getContext("2d"), {
                    type: scope.type,
                    data: {
                        labels: scope.labels,
                        datasets: scope.data
                    },
                    options: {
                        scales: scale,
                        responsive: true,
                        title: {
                            display: true,
                            text: scope.title
                        },
                        legend:  {
                            display: scope.legend,
                            position: 'bottom'
                        }
                    }
                });
            }
        }
    });