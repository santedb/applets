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
            controller: ['$scope', '$rootScope', '$timeout', function ($scope, $rootScope, $timeout) {

                $scope.refreshValueList = async function () {

                    if (!$scope.parameter || $scope.parameter.values.list) return;
                    try {
                        var parameters = [{ id: null, value: SanteDB.locale.getString("ui.wait") }];
                        $timeout(() => $scope.parameter.values.list = parameters);

                        // Now fetch
                        // TODO: Add parameters list here
                        // TODO: Add fetch here
                        parameters = await SanteDBBi.executeQueryAsync($scope.parameter.id, { _count: 1000 });
                        $timeout(() => $scope.parameter.values.list = parameters);
                    }
                    catch (e) {

                    }
                }
            }],
            link: function (scope, element, attrs) {

                if (scope.values && scope.values[scope.parameter.name])
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
                reportId: "=",
                parameters: "=",
                view: "="
            },
            restrict: "E",
            replace: true,
            transclude: false,
            templateUrl: "/org.santedb.bicore/directives/report.html",
            controller: ['$scope', '$rootScope', '$timeout', '$compile', function ($scope, $rootScope, $timeout, $compile) {

                var dt = {};
                $scope.parameterValues = {};

                function setReportContent(elementId, content) {

                    if (dt[elementId]) {
                        dt[elementId].destroy();
                        delete dt[elementId];
                    }

                    var element = $(`#${elementId}`);
                    element.html(content);

                    // Data tables?
                    var tableData = $("table", $(element));
                    if (tableData.length > 0) {
                        $(tableData).addClass("table table-striped w-100");
                        $(tableData).DataTable();
                    }
                    if ($compile)
                        $compile($(element))($scope);
                };

                // Prints the current report with the specified parameters
                $scope.printReport = async function (view) {
                    try {
                        SanteDB.display.buttonWait(`#btnPrintReport_${view.name}`, true);
                        var report = await SanteDBBi.renderReportAsync($scope.reportId, view.name, "html", $scope.parameterValues);

                        var headerInjection = `<link rel="stylesheet" type="text/css" href="/org.santedb.bicore/css/print.css?${new Date()}" />`;
                        report = report.replace(`<title>${view.name}</title>`, `<title>${SanteDB.locale.getString($scope.report.label)} - ${SanteDB.locale.getString(view.label)}</title>`);
                        // replace report output wrapper
                        report = report.replace("</head>", `${headerInjection}</head>`);

                        var printFn = function (printWindow) {
                            printWindow.document.write(report);
                            printWindow.document.close();
                            printWindow.focus();

                            // HACK: Need a better way to wait for all data to complete
                            $(printWindow.document).ready(function () {
                                setTimeout(function () {
                                    printWindow.print();
                                    printWindow.close();
                                }, 400);

                            });
                        };

                        var win = window.open('', '_blank');

                        if (win.document) {
                            printFn(win);
                        }
                        else {
                            setTimeout(function () {
                                printFn(win);
                            }, 1000);
                        }


                    }
                    catch (e) {
                        $rootScope.errorHandler(e);
                    }
                    finally {
                        SanteDB.display.buttonWait(`#btnPrintReport_${view.name}`, false);

                    }
                }

                // Downloads the report 
                $scope.downloadReport = async function (view, format) {
                    try {
                        SanteDB.display.buttonWait(`#btnDownloadReport_${view}`, true);

                        var parameterValues = angular.copy($scope.parameterValues);
                        Object.keys(parameterValues).forEach(p => {
                            if (parameterValues[p] instanceof Date) {
                                parameterValues[p] = new moment(parameterValues[p]).format('YYYY-MM-DD')
                            }
                        });

                        var parms = jQuery.param(parameterValues);
                        parms += `&_download=true`; //&_sessionId=${window.sessionStorage.token}`;


                        var win = window.open(`/bis/Report/${format}/${$scope.report.id}?${parms}&_view=${view}`, '_blank');
                        win.onload = function (e) {
                            win.close();
                        };


                    }
                    catch (e) {
                        $rootScope.errorHandler(e);
                    }
                    finally {
                        SanteDB.display.buttonWait(`#btnDownloadReport_${view}`, false);
                    }
                }

                $scope.updateParameterValues = async function (form) {

                    try {
                        SanteDB.display.buttonWait("#btnApply", true);

                        // Get the report rendering
                        await Promise.all($scope.report.views.map(async v => {
                            var parameters = angular.copy($scope.parameterValues);
                            parameters["_count"] = 1000;
                            var html = await SanteDBBi.renderReportAsync($scope.reportId, v.name, "html", parameters);
                            setReportContent(`${$scope.htmlId}_${v.name}view`, html);
                        }));
                        $timeout(() => {
                            $scope.report.hasRun = true;

                            $timeout(() => {
                                // Select the view
                                if ($scope.view)
                                    $(`#${$scope.htmlId}_${$scope.view}_tab a`).click();
                                else
                                    $(`#${$scope.htmlId}_${$scope.report.views[0].name}_tab a`).click();
                            })
                        });


                    }
                    catch (e) {
                        $rootScope.errorHandler(e);
                    }
                    finally {
                        SanteDB.display.buttonWait("#btnApply", false);
                    }
                }

                async function initialize() {
                    try {
                        var formats = await SanteDBBi.resources.format.findAsync();
                        var report = await SanteDBBi.resources.report.getAsync($scope.reportId);

                        $timeout(() => {

                            $scope.formats = formats.resource;
                            $scope.report = report;
                            // Process the parameters from the result
                            var parameters = [];
                            report.dataSources.forEach(function (r) {
                                if (r.query)
                                    r.query.parameters.forEach(function (p) {
                                        if (parameters.find(ep => ep.name == p.name) == null) {
                                            if ($scope.parameters)
                                                p.value = $scope.parameters[p.name];
                                            parameters.push(p);
                                        }
                                    });
                                else if (r.parameters)
                                    r.parameters.forEach(function (p) {
                                        if (parameters.find(ep => ep.name == p.name) == null) {
                                            if ($scope.parameters)
                                                p.value = $scope.parameters[p.name];
                                            parameters.push(p);
                                        }
                                    });
                            });

                            $scope.htmlId = $scope.reportId.replace(/\./g, "");
                            $scope.report = report;
                            $scope.report.parameterDefinitions = parameters;

                            if ($scope.report.parameterDefinitions == undefined ||
                                $scope.report.parameterDefinitions.length == 0) {
                                $scope.updateParameterValues();
                            }
                        });
                    }
                    catch (e) {
                        $rootScope.errorHandler(e);
                    }
                }

                initialize();


            }],
            link: function (scope, element, attrs) {


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


        (function ($) {
            function ReportViewJquery(scope) {
                this.refresh = function (e) {
                    scope.isRendering = false;
                    scope.renderReport();
                };
            }
            $.fn.extend({
                reportView: function (scope) {
                    this.each(function () {
                        if (!this.ReportView) {
                            this.ReportView = new ReportViewJquery(scope || angular.element($(this).scope()));
                        }
                    });
                }
            });
        })(jQuery);

        return {
            scope: {
                reportId: "<",
                parameters: "=",
                view: "<",
            },
            restrict: "E",
            replace: true,
            transclude: false,
            template: "<div></div>",
            controller: ['$scope', '$rootScope', function ($scope, $rootScope) {
            }],
            link: function (scope, element, attrs) {

                var nodt = attrs.noDataTables == "true";
                var responsiveTables = attrs.responsiveTables == "true";

                var dt = null; // data table reference
                // HACK: Parmaeters weren't passed so we shall construct them
                if (!scope.parameters)
                    scope.parameters = {};

                var setReportContent = function (content, compile) {

                    if (dt)
                        dt.destroy();
                    $(element).html(content);

                    // Data tables?
                    if (!nodt) {
                        var tableData = $("table", $(element));
                        if (tableData.length > 0) {
                            $(tableData).addClass("table table-striped w-100");
                            $(tableData).DataTable();
                        }
                    }
                    else if (responsiveTables) {
                        $("table", $(element)).addClass("table-responsive");
                    }

                    if (compile)
                        $compile($(element))(scope);
                };

                var hasRendered = false;

                // Report rendering function
                scope.renderReport = function (n, o) {
                    if (scope.reportId &&
                        scope.view &&
                        !scope.isRendering) {
                        hasRendered = true;
                        scope.parameters = scope.parameters || {};
                        setReportContent(`<i class='fas fa-circle-notch fa-spin'></i> ${SanteDB.locale.getString("ui.wait")}`, false);
                        scope.isRendering = true;
                        SanteDBBi.renderReportAsync(scope.reportId, scope.view, "html", scope.parameters)
                            .then(function (d) {
                                scope.isRendering = false;
                                setReportContent(d, true);
                            })
                            .catch(function (e) {
                                var cause = e;
                                while (cause.cause)
                                    cause = cause.cause;
                                cause.detail = cause.detail || {};
                                scope.isRendering = false;
                                setReportContent(`<div class='alert alert-info'><i class="fas fa-exclamation-triangle"></i> ${SanteDB.locale.getString(cause.message)} - ${cause.detail.statusText} - ${cause.detail.responseText}</div>`, true);
                            });
                    }
                }


                scope.renderReport(null, null);
                scope.$watch((s) => {
                    return !s.parameters ? "" : JSON.stringify(s.parameters);
                }, function (n, o) {
                    if (n && (o != n)) {
                        scope.isRendering = false;
                        scope.renderReport(n, o);
                    }
                });

                if (attrs.id) {
                    $(element).reportView(scope);
                }
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

            if (isNaN(context)) {
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
                axisX: "<",
                axisY: "<",
            },
            restrict: 'E',
            replace: true,
            transclude: true,
            template: '<canvas></canvas>',
            controller: ['$scope',
                function ($scope) {
                }
            ],
            link: function (scope, element, attrs, ngModel) {

                if (!Array.isArray(scope.data))
                    scope.data = [scope.data];

                for (var i in scope.data) {
                    if (parseInt(i) === NaN) continue;
                    if (scope.type == "line" || scope.type == "radar") {

                        scope.data[i].backgroundColor = scope.data[i].backgroundColor || randomColor(0.1, parseInt(i));
                        scope.data[i].borderColor = scope.data[i].borderColor || randomColor(1, parseInt(i));
                        scope.data[i].pointBackgroundColor = scope.data[i].pointBackgroundColor || 'rgba(0,0,0,0.1)';
                        scope.data[i].pointBorderColor = scope.data[i].pointBorderColor || 'rgba(0,0,0,0.1)';
                    }
                    else if (scope.type == "bar") {
                        scope.data[i].backgroundColor = scope.data[i].backgroundColor || randomColor(0.5, parseInt(i));
                        scope.data[i].borderColor = scope.data[i].borderColor || randomColor(1, parseInt(i));
                    }
                    else {
                        scope.data[i].backgroundColor = scope.data[i].backgroundColor || randomColor.bind(null, 0.5);
                        scope.data[i].borderColor = scope.data[i].borderColor || randomColor.bind(null, 1);
                    }
                    scope.data[i].borderWidth = 1;
                }

                var yAxis = scope.axisY || {};
                if (scope.type == 'bar' || scope.type == 'line') {
                    var scale = {
                        yAxes: [{
                            scaleLabel: {
                                display: yAxis.scaleLabel !== undefined,
                                labelString: yAxis.scaleLabel
                            },
                            ticks: {
                                beginAtZero: false,
                                min: yAxis.min,
                                max: yAxis.max,
                                grace: yAxis.grace || '10%'
                            }
                        }]
                    };
                    var xAxis = scope.axisX;
                    if (xAxis) {
                        scale.xAxes = [{
                            type: xAxis.type,
                            position: 'bottom',
                            display: true,
                            scaleLabel: {
                                display: true,
                                labelString: xAxis.scaleLabel
                            },
                            ticks: {
                                stepSize: xAxis.stepSize || 1
                            }
                        }];

                        if (xAxis.type == 'time' || xAxis.type == 'timeseries') {
                            scale.xAxes[0].time = xAxis.time;
                        }
                    }
                }

                // Correct any datasets
                scope.data = scope.data.map(d => {
                    if (d.type == "bubble") {
                        d.data = d.data.map((p, i) => {
                            p = p || {};
                            return {
                                y: p.y || 0,
                                r: p.r || p,
                                x: p.x || scope.labels[i]
                            }
                        });
                    }
                    return d;
                })
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
                        legend: {
                            display: scope.legend,
                            position: 'bottom'
                        }
                    }
                });
            }
        }
    });