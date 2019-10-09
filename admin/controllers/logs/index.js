/// <reference path="../../../core/js/santedb.js"/>
angular.module('santedb').controller('LogIndexController', ["$scope", "$rootScope", "$timeout", "$compile", function ($scope, $rootScope, $timeout, $compile) {
 
    
    // Change handler for show option
    $scope.updateView = function() {
        dt.ajax.reload();
    }

    // Initial value 
    $scope.extern = 'false';
    var dt = $("#logInfoTable").DataTable({
        serverSide: true,
        buttons: [
            'reload'
        ],
        columns: [
            {
                data: 'name',
                orderable: true
            },
            {
                orderable: true,
                render: function(d, t, r) {
                    return moment(r.modified).format(SanteDB.locale.dateFormats.full);
                }
            },
            {
                orderable: true,
                render: function(d, t, r) {
                    return (r.size / 1024).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + " KB";
                }
            },
            {
                orderable: false,
                render: function(d, t, r, i) {
                    return `<a class="btn btn-primary" ui-sref="santedb-admin.system.logs.view({ id: '${r.name}' })"><i class="fas fa-eye"></i> <span
                    class="d-sm-none d-lg-inline"> {{ 'ui.action.view' | i18n }}</span></a>`;
                }
            }
        ],
        ajax: function (data, callback, settings) {

            var query = {
                _extern: $scope.extern,
                _count: data.length,
                _offset: data.start
            };
            if (data.search.value.length > 0)
                query.name = `~${data.search.value}`;
            if (data.order.length > 0) {
                
                var colname = null;
                switch(data.order[0].column)
                {
                    case 0:
                        colname = "name";
                        break;
                    case 1:
                        colname = "modified";
                        break;
                    case 2: 
                        colname = "size";
                        break;
                }
                query["_orderBy"] = `${colname}:${data.order[0].dir}`;
            }

            SanteDB.application.getLogInfoAsync(null, query)
                .then(function (res) {
                    callback({
                        data: res.item.map(function (item) {
                            return item;
                        }),
                        recordsTotal: undefined,
                        recordsFiltered: res.totalResults || res.size
                    });
                })
                .catch(function (err) { $rootScope.errorHandler(err) });
        },
        createdRow: function (r, d, i) {
            $compile(angular.element(r).contents())($scope);
            $scope.$digest()
        },
    });

    // Bind buttons
    var bindButtons = function () {
        dt.buttons().container().appendTo($('.col-md-6:eq(1)', dt.table().container()));
        if (dt.buttons().container().length == 0)
            $timeout(bindButtons, 100);
        else 
            $("#extraControls").appendTo($('.col-md-6:eq(0)', dt.table().container()));
    };
    bindButtons();
 }]);
 