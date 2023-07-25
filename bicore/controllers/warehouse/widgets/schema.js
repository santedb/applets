/// <reference path="../../../../core/js/santedb.js"/>
/// <reference path="../../../js/santedb-bi.js"/>

angular.module('santedb').controller('DataMartSchemaController', ["$scope", function ($scope) {

    $scope.currentZoom = 100;
    $scope.zoom = function(factor) {
        $scope.currentZoom += factor;
        $("svg#entityRelationshipDiagram").css("width", `${$scope.currentZoom}%`);

    }

    function renderRelationships(table, schema) {
        var retVal = "";
        table.columns.filter(column=>column.type == "Ref").forEach(column => {
            retVal += `\t${column.otherTable.$ref} |${column.notNull ? '|' : 'o' }--o{ ${table.name} : ${column.name} \r\n`;
        });

        if(table.parent) {
            var parentTable = schema.find(o=>o.name == table.parent.$ref);
            var keyTable = parentTable;
            while(keyTable.parent) {
                keyTable = schema.find(o=>o.name == keyTable.parent.$ref);
            }
            retVal += `\t${parentTable.name} ||--|| ${table.name} : ${keyTable.columns.find(c=>c.key).name} \r\n`;
        }
        return retVal;
    }

    function renderTableSchema(table, schema) {
        var retVal = `\t${table.name} {\r\n`;
        table.columns.forEach(column => {
            var atts = [], desc = [];
            if(column.key) {
                atts.push('PK');
            }
            if(column.unique) {
                atts.push('UK');
            }
            if(column.index) {
                desc.push('INDEXED');
            }
            if(column.notNull) {
                desc.push('NOT NULL');
            }
            if(column.otherTable) {
                atts.push('FK');
            }

            if(column.type == "Ref") {
                var otherTable = schema.find(o=>o.name == column.otherTable.$ref);
                var keyTable = otherTable;
                while(keyTable.parent) {
                    keyTable = schema.find(o=>o.name == keyTable.parent.$ref);
                }
                column.type = keyTable.columns.find(o=>o.key).type;
                desc.push(`Reference to ${otherTable.name}`);
            }
            retVal += `\t\t${column.type} ${column.name} ${atts.join(',')} "${desc.join(',')}"\r\n`;
        })

        if(table.parent) {
            var parentTable = schema.find(o=>o.name == table.parent.$ref);
            while(parentTable.parent) {
                parentTable = schema.find(o=>o.name == parentTable.parent.$ref);
            }
            var keyColumn = parentTable.columns.find(c=>c.key);
            retVal += `\t\t${keyColumn.type} ${keyColumn.name} PK,FK "Parent Table Link to ${table.parent.$ref}" \r\n`;
        }

        retVal += "\t}\r\n";
        return retVal;
    }
    $scope.$watch("scopedObject", function(o, n) {

        if(n) {
            var graphDefinition = "erDiagram\r\n";
            n.schemas.forEach(table => graphDefinition += renderRelationships(table, n.schemas));
            n.schemas.forEach(table => graphDefinition += renderTableSchema(table, n.schemas));
            mermaid.mermaidAPI.render('entityRelationshipDiagram', graphDefinition, (svg) => {
                svg = svg.replace(/max-width: .*?px/, "max-width: none !important");
                $('#renderSvgEntityRelationshipDiagram').html(svg);
            });

        }
    });

}]);
