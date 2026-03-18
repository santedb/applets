// Strip any <SCRIPT> or HTML from markdown and render
function renderMarkdownSafe(md) {
    return marked.parse(md.replaceAll("<", "&lt;").replaceAll(">", "&gt;"));
}

angular.module("santedb").controller("MailController", ["$scope", "$rootScope", "$state", "$timeout", "$stateParams", '$compile', function ($scope, $rootScope, $state, $timeout, $stateParams, $compile) {


    var _dataTable = null;

    function composeMessage(action, target) {

        const draftMessage = {
            from: $rootScope.session.user.id,
            rcpt: [],
            _oldBody: ""
        };

        switch (action) {
            case "reply":
                draftMessage.subject = `RE: ${target.messageModel.subject}`;
                draftMessage.rcpt = [target.messageModel.from];
                draftMessage.body = `\r\n\r\n---\r\n**On ${SanteDB.display.renderDate(target.time, 'M')} ${target.messageModel.fromInfo} wrote:**\r\n\r\n${target.messageModel.body}`;
                break;
            case "reply-all":
                draftMessage.subject = `RE: ${target.messageModel.subject}`;
                draftMessage.rcpt = target.messageModel.rcpt.filter(o => o != $rootScope.session.user.id);
                draftMessage.rcpt.push(target.messageModel.from);
                draftMessage.body = `\r\n\r\n---\r\n**On ${SanteDB.display.renderDate(target.time, 'M')} ${target.messageModel.fromInfo} wrote:**\r\n\r\n${target.messageModel.body}`;
                break;
            case "forward":
                draftMessage.subject = `FW: ${target.messageModel.subject}`;
                draftMessage.body = target.messageModel.body;
                break;
        }

        $timeout(() => {
            $scope.draftMessage = draftMessage;
            $("#composeMessageModal").modal('show');
        });
    }

    async function setSelectedMessage(mailbox, messageId) {
        try {

            var message = await SanteDB.resources.mail.getAssociatedAsync(mailbox, "MailMessage", messageId, null, undefined, "mail");
            message.html = renderMarkdownSafe(message.messageModel.body);
            if (message.flags === 0) {
                await SanteDB.resources.mail.invokeOperationAsync(mailbox, "flag-mail", {
                    message: messageId,
                    flag: 1
                }, undefined);
                _dataTable?.ajax.reload();
            }
            $timeout(() => {
                $scope.selectedMessage = message;
            });
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    async function initializeView(mailbox, messageId) {
        try {
            var mailboxes = await SanteDB.resources.mail.findAsync({}, null, undefined);
            var activeMailbox = mailboxes.resource.find(o => o.name == mailbox || o.id == mailbox);

            window.title += ` - ${activeMailbox.name}`;
            $timeout(() => {
                $scope.mailboxes = mailboxes.resource;
                $scope.activeMailbox = activeMailbox;
            });

            // Load the current mailbox?
            if (messageId) {
                await setSelectedMessage(mailbox, messageId);
            }

            // Initialize the datatable view
            var interval = null;
            interval = setInterval(() => {
                var expectedTable = $("#mailMessageTable");
                if (expectedTable.length > 0) {
                    initializeDataTable("#mailMessageTable");
                    clearInterval(interval);
                }
            }, 500)
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    function initializeDataTable(target) {

        _dataTable = $(target).DataTable({
            buttons: [
                {
                    text: "<i class='fas fa-fw fa-plus-circle'></i> " + SanteDB.locale.getString("ui.mail.compose"),
                    className: 'btn btn-sm btn-primary ml-1',
                    action: () => composeMessage()
                },
                {
                    text: "<i class='fas fa-sync'></i> " + SanteDB.locale.getString("ui.action.reload"),
                    className: "btn btn-sm btn-success",
                    action: () => _dataTable?.ajax.reload()
                }
            ],
            columns: [
                {
                    data: "id",
                    visible: false
                },
                {
                    data: "from",
                    type: "string",
                    render: (d, t, r, m) => `<i class="fas fa-fw fa-user"></i> ${r.messageModel.fromModel?.userName || r.messageModel.fromInfo}`,
                    orderable: false
                },
                {
                    data: "subject",
                    type: "string",
                    render: (d, t, r, m) => {
                        var retVal = "";
                        switch (r.flags) {
                            case 0: // unread:
                                retVal = '<i class="fas fa-fw fa-envelope mr-2"></i>';
                                break;
                            case 1: // read
                                retVal = '<i class="fas fa-fw fa-envelope-open mr-2"></i>';
                                break;
                            case 2: // flagged
                                retVal = '<i class="fas fa-fw fa-flag mr-2"></i>';
                                break;
                            case 4: // complete
                                retVal = '<i class="fas fa-fw fa-check-circle mr-2"></i>';
                                break;
                        }

                        retVal += r.messageModel.subject;

                        if (r.messageModel.flags) {
                            switch (r.messageModel.flags) {
                                case 1: // ALERT
                                    retVal += "<span class='ml-2 badge badge-dark'><i class='fas fa-fw fa-exclamation-triangle'></i></span>";
                                    break;
                                case 2: // LOW
                                    retVal += "<span class='ml-2 badge badge-info'><i class='fas fa-fw fa-arrow-down'></i></span>";
                                    break;
                                case 4: // HIGH
                                    retVal += "<span class='ml-2 badge badge-danger'><i class='fas fa-fw fa-arrow-up'></i></span>";
                                    break;
                            }
                        }
                        return retVal;
                    },
                    orderable: false
                },
                {
                    name: "time",
                    data: "time",
                    type: Date.name,
                    render: (d, t, r, m) => SanteDB.display.renderDate(r.time, 'M')
                }
            ],
            createdRow: function (r, d, i) {
                $compile(angular.element(r).contents())($scope);

                switch (d.flags) {
                    case 0: // unread
                        $(r).addClass("bg-light");
                        $(r).addClass("font-weight-bold");
                        $(r).addClass("text-primary");
                        break;
                    case 2: // flagged
                        $(r).addClass('bg-light');
                        $(r).addClass('text-danger');
                        $(r).addClass("font-weight-bold");
                        break;
                    case 4: // resolved
                        $(r).addClass('text-success');
                        break;
                }

                if ($scope.selectedMessage?.id == d.id) {
                    $(r).addClass("selected");
                }
            },
            serverSide: true,
            processing: true,
            searching: true,
            layout: {
                top2Start: 'buttons',
                topStart: 'info',
                top2End: 'search',
                topEnd: 'paging',
                bottomStart: null,
                bottomEnd: null
            },
            ajax: async (data, callback) => {
                var query = {
                    _count: data.length,
                    _offset: data.start,
                    _includeTotal: true,
                    "message.subject||message.from.userName": `~%${data.search?.value}%`
                };

                if (data.order && data.order[0] && data.order[0].column != 0) {
                    query._orderBy = `${data.order[0].name}:${data.order[0].dir}`;
                }
                else {
                    query._orderBy = "time:desc";
                }

                try {
                    var data = await SanteDB.resources.mail.findAssociatedAsync($scope.activeMailbox.id, "MailMessage", query, "fastView");
                    callback({
                        data: data.resource,
                        recordsTotal: data.totalResults || data.size || 0,
                        recordsFiltered: data.totalResults || data.size || 0,
                        iTotalRecords: data.totalResults || data.size || 0,
                        iTotalDisplayRecords: data.totalResults || data.size || 0
                    });
                }
                catch (e) {
                    $rootScope.errorHandler(e);
                }
            },
            fixedHeader: true,
            scrollY: "20vh",
            scrollCollapse: true,
            language: {
                "decimal": "",
                "emptyTable": SanteDB.locale.getString("ui.table.empty"),
                "info": SanteDB.locale.getString("ui.table.info"), // "Showing _START_ to _END_ of _TOTAL_ entries",
                "infoEmpty": SanteDB.locale.getString("ui.table.infoEmpty"),
                "infoFiltered": SanteDB.locale.getString("ui.table.infoFiltered"), // "(filtered from _MAX_ total entries)",
                "infoPostFix": "",
                "thousands": ",",
                "search": SanteDB.locale.getString("ui.table.search"),
                "zeroRecords": SanteDB.locale.getString("ui.table.noRecords"),
                "paginate": {
                    "first": SanteDB.locale.getString("ui.table.page.first"),
                    "last": SanteDB.locale.getString("ui.table.page.last"),
                    "next": SanteDB.locale.getString("ui.table.page.next"),
                    "previous": SanteDB.locale.getString("ui.table.page.previous")
                },
                "aria": {
                    "sortAscending": SanteDB.locale.getString("ui.table.sort.ascending"),
                    "sortDescending": SanteDB.locale.getString("ui.table.sort.descending")
                },
                "searchPlaceholder": SanteDB.locale.getString(`ui.table.search.field.subject||from`)
            }
        });

        _dataTable.on('click', 'tbody tr', (e) => {
            var classList = e.currentTarget.classList;
            var data = _dataTable.row(e.currentTarget).data();
            if (classList.contains('selected')) {
                classList.remove('selected');
                $timeout(() => $scope.selectedMessage = null);
            }
            else {
                _dataTable.rows('.selected').nodes().each((row) => {
                    row.classList.remove('selected');
                });
                classList.add('selected');

                $timeout(() => $scope.selectedMessage = {});
                setSelectedMessage($scope.activeMailbox.id, data.message);
            }
        });

        $("#composeMessageModal").on("hidden.bs.modal", function (o, e) {
            $scope.draftMessage = null;
        });

    }

    initializeView($stateParams.mbx || EmptyGuid, $stateParams.mid);

    $scope.deleteMessage = async function (message) {
        if (!confirm(SanteDB.locale.getString($scope.activeMailbox.name == 'Deleted' ? 'ui.mail.action.delete.confirmPurge' : 'ui.mail.action.delete.confirm'))) {
            return;
        }

        try {
            await SanteDB.resources.mail.removeAssociatedAsync($scope.activeMailbox.id, "MailMessage", message.message || message);
            toastr.success(SanteDB.locale.getString("ui.mail.action.delete.success"));
            $timeout(() => {
                _dataTable?.ajax.reload();
                $scope.selectedMessage = null;
            });
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    $scope.flagMessage = async function (message, flag) {
        try {
            var message = await SanteDB.resources.mail.invokeOperationAsync($scope.activeMailbox.id, "flag-mail", {
                flag: flag,
                message: message.message || message
            }, undefined, "mail");
            message.html = renderMarkdownSafe(message.messageModel.body);

            toastr.success(SanteDB.locale.getString("ui.mail.action.flag.success"));
            $timeout(() => {
                _dataTable?.ajax.reload();
                $scope.selectedMessage = message;
            });
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    $scope.moveMessage = async function (message, toMailbox) {
        try {
            var message = await SanteDB.resources.mail.invokeOperationAsync($scope.activeMailbox.id, "move-mail", {
                destination: toMailbox,
                message: message.message || message,
                copy: false
            });
            toastr.success(SanteDB.locale.getString("ui.mail.action.move.success"));
            $timeout(() => {
                $scope.selectedMessage = null;
                _dataTable?.ajax.reload();
            });
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    $scope.addFolder = () => $scope.newFolder = { name: "" };

    $scope.composeMessage = composeMessage;
    $scope.saveNewFolder = async function (form) {
        if (form.$invalid) {
            return;
        }
        try {
            SanteDB.display.buttonWait("#addFolderButton", true);
            var newFolder = await SanteDB.resources.mail.insertAsync({
                "$type": "Mailbox",
                "name": $scope.newFolder.name
            }, undefined);

            $timeout(() => {
                $scope.newFolder = null;
                $scope.mailboxes.push(newFolder);
                toastr.success(SanteDB.locale.getString("ui.mail.action.newFolder.success"));
            });
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#addFolderButton", false);
        }
    }

    $scope.deleteMailbox = async function (mailbox) {
        if (!confirm(SanteDB.locale.getString("ui.mail.action.deleteFolder.confirm", { folder: mailbox.name }))) {
            return;
        }

        try {
            await SanteDB.resources.mail.deleteAsync(mailbox.id, undefined);
            $timeout(() => {
                var idx = $scope.mailboxes.findIndex(o => o.id == mailbox.id);
                $scope.mailboxes.splice(idx, 1);

                $state.go(".", { mbx: $scope.mailboxes.find(o=>o.name === "Inbox").id});
                toastr.success(SanteDB.locale.getString("ui.mail.action.deleteFolder.succes", { folder: mailbox.name }));
            })
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    $scope.sendMessage = async function (form) {
        if (form.$invalid) {
            return;
        }

        try {

            // HACK: We want the displayed info for offline use later on
            var toLine = "";
            $("#mailTo option").filter((o,e) => e.selected).each((o,e)=> toLine += `${/(.+)\(.*/i.exec(e.title)[1].trim()};`);
            SanteDB.display.buttonWait("#btnSendMessage", true);
            await SanteDB.resources.mail.invokeOperationAsync(null, "send-mail", {
                subject: $scope.draftMessage.subject,
                body: $scope.draftMessage.body,
                to: toLine.substring(0, toLine.length - 1),
                rcptTo: $scope.draftMessage.rcpt,
                flag: $scope.draftMessage.flags
            }, undefined, null, "json", "application/json");

            $("#composeMessageModal").modal("hide");
            toastr.success(SanteDB.locale.getString("ui.mail.sent"));
            _dataTable?.ajax.reload();

        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#btnSendMessage", false);
        }
    }

    $scope.renderPreview = () => {
        $scope.draftMessage.html = renderMarkdownSafe($scope.draftMessage.body);
    }
}]).controller("DeviceMailboxController", ["$scope", "$rootScope", "$timeout", function ($scope, $rootScope, $timeout) {

    async function initializeView() {
        try {
            var deviceMail = await SanteDB.application.getDeviceMail({ _orderBy: "time:desc", _includeTotal: true, _count: 4 });
            deviceMail.resource?.forEach(msg => msg.messageModel.html = renderMarkdownSafe(msg.messageModel.body));
            $timeout(() => $scope.deviceMailbox = deviceMail);
        }
        catch (e) {
            toastr.warning(e.message);
            $timeout(() => $scope.deviceMailbox = { resource: {} });

        }
    }

    initializeView();

    $scope.deleteMessage = async function(message) {
        if(confirm(SanteDB.locale.getString("ui.mail.action.delete.confirmDevice"))) {
            try {
                await SanteDB.application.acknowledgeDeviceMail(message);
                toastr.success(SanteDB.locale.getString("ui.mail.action.delete.success"));
                await initializeView();
            }
            catch(e) {
                $rootScope.errorHandler(e);
            }
        }
    }
}]);