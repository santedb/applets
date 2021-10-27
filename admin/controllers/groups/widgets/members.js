angular.module('santedb').controller('EditGroupMembersController', ["$scope", "$rootScope", "$state", "$templateCache", "$stateParams", "$compile", '$timeout', function ($scope, $rootScope, $state, $templateCache, $stateParams, $compile, $timeout) {

    /**
     * @summary Add the newUser object to the group
     */
     $scope.addUser = function () {
        // Add new user
        $scope.newUser.exec = true;
        $scope.newUser.$type = 'SecurityUser';
        SanteDB.resources.securityRole.addAssociatedAsync($scope.scopedObject.securityRole.id, 'user', $scope.newUser)
            .then(function (d) {
                delete ($scope.newUser);

                membersTable.ajax.reload();
            })
            .catch(function (e) {
                delete ($scope.newUser);
                $rootScope.errorHandler(e);
            })
    }

    /**
     * @summary Remove the specified user
     */
    $scope.deleteUser = function (uid) {
        if (confirm(SanteDB.locale.getString("ui.admin.securityRole.removeUserConfirm"))) {
            SanteDB.resources.securityRole.removeAssociatedAsync($scope.scopedObject.securityRole.id, 'user', uid)
                .then(function (d) {
                    membersTable.ajax.reload();
                })
                .catch($rootScope.errorHandler);
        }
    }

    // Now create datatables
    $scope.$watch('scopedObject.securityRole', function (n, o) {
        if (n) {
            membersTable = $("#groupMembershipTable").DataTable({
                lengthChange: false,
                processing: true,
                retrieve: true,
                buttons: [
                ],
                serverSide: true,
                ajax: function (data, callback, settings) {

                    var query = { "roles.id": $stateParams.id };
                    if (data.search.value.length > 0)
                        query["userName"] = `~${data.search.value}`;
                    if (data.order[0]) {
                        query["_orderBy"] = `userName:${data.order[0].dir}`;
                    }

                    query["_count"] = data.length;
                    query["_offset"] = data.start;

                    SanteDB.resources.securityUser.findAsync(query)
                        .then(function (res) {
                            callback({
                                data: res.resource.map(function (item) { return item.entity; }),
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
                columns: [
                    {
                        data: 'userName',
                        defaultValue: ''
                    },
                    {
                        orderable: false,
                        render: function (d, t, r, m) {
                            return `<button ng-click="deleteUser('${r.id}')" class="btn btn-danger" id="delUsr-${r.id}"><i class="fas fa-times"></i><span class="d-sm-none d-lg-inline"> ${SanteDB.locale.getString("ui.action.remove")}</span></button>`;
                        }
                    }
                ]
            });

            // Bind buttons
            var bindButtons = function () {
                membersTable.buttons().container().appendTo($('.col-md-6:eq(1)', membersTable.table().container()));
                if (membersTable.buttons().container().length == 0)
                    $timeout(bindButtons, 100);
                else {
                    $("#addUserToGroup").appendTo($('.col-md-6:eq(0)', membersTable.table().container()));
                }
            };
            bindButtons();
        }

    });

}]);
