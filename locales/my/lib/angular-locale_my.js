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
'use strict';
angular.module("ngLocale", [], ["$provide", function($provide) {
var PLURAL_CATEGORY = {ZERO: "zero", ONE: "one", TWO: "two", FEW: "few", MANY: "many", OTHER: "other"};
$provide.value("$locale", {
  "DATETIME_FORMATS": {
    "AMPMS": [
      "\u1014\u1036\u1014\u1000\u103a",
      "\u100a\u1014\u1031"
    ],
    "DAY": [
      "\u1010\u1014\u1004\u103a\u1039\u1002\u1014\u103d\u1031",
      "\u1010\u1014\u1004\u103a\u1039\u101c\u102c",
      "\u1021\u1004\u103a\u1039\u1002\u102b",
      "\u1017\u102f\u1012\u1039\u1013\u101f\u1030\u1038",
      "\u1000\u103c\u102c\u101e\u1015\u1010\u1031\u1038",
      "\u101e\u1031\u102c\u1000\u103c\u102c",
      "\u1005\u1014\u1031"
    ],
    "ERANAMES": [
      "\u1001\u101b\u1005\u103a\u1010\u1031\u102c\u103a \u1019\u1015\u1031\u102b\u103a\u1019\u102e\u1014\u103e\u1005\u103a",
      "\u1001\u101b\u1005\u103a\u1014\u103e\u1005\u103a"
    ],
    "ERAS": [
      "\u1018\u102e\u1005\u102e",
      "\u1021\u1031\u1012\u102e"
    ],
    "FIRSTDAYOFWEEK": 6,
    "MONTH": [
      "\u1007\u1014\u103a\u1014\u101d\u102b\u101b\u102e",
      "\u1016\u1031\u1016\u1031\u102c\u103a\u101d\u102b\u101b\u102e",
      "\u1019\u1010\u103a",
      "\u1027\u1015\u103c\u102e",
      "\u1019\u1031",
      "\u1007\u103d\u1014\u103a",
      "\u1007\u1030\u101c\u102d\u102f\u1004\u103a",
      "\u1029\u1002\u102f\u1010\u103a",
      "\u1005\u1000\u103a\u1010\u1004\u103a\u1018\u102c",
      "\u1021\u1031\u102c\u1000\u103a\u1010\u102d\u102f\u1018\u102c",
      "\u1014\u102d\u102f\u101d\u1004\u103a\u1018\u102c",
      "\u1012\u102e\u1007\u1004\u103a\u1018\u102c"
    ],
    "SHORTDAY": [
      "\u1010\u1014\u1004\u103a\u1039\u1002\u1014\u103d\u1031",
      "\u1010\u1014\u1004\u103a\u1039\u101c\u102c",
      "\u1021\u1004\u103a\u1039\u1002\u102b",
      "\u1017\u102f\u1012\u1039\u1013\u101f\u1030\u1038",
      "\u1000\u103c\u102c\u101e\u1015\u1010\u1031\u1038",
      "\u101e\u1031\u102c\u1000\u103c\u102c",
      "\u1005\u1014\u1031"
    ],
    "SHORTMONTH": [
      "\u1007\u1014\u103a",
      "\u1016\u1031",
      "\u1019\u1010\u103a",
      "\u1027",
      "\u1019\u1031",
      "\u1007\u103d\u1014\u103a",
      "\u1007\u1030",
      "\u1029",
      "\u1005\u1000\u103a",
      "\u1021\u1031\u102c\u1000\u103a",
      "\u1014\u102d\u102f",
      "\u1012\u102e"
    ],
    "STANDALONEMONTH": [
      "\u1007\u1014\u103a\u1014\u101d\u102b\u101b\u102e",
      "\u1016\u1031\u1016\u1031\u102c\u103a\u101d\u102b\u101b\u102e",
      "\u1019\u1010\u103a",
      "\u1027\u1015\u103c\u102e",
      "\u1019\u1031",
      "\u1007\u103d\u1014\u103a",
      "\u1007\u1030\u101c\u102d\u102f\u1004\u103a",
      "\u1029\u1002\u102f\u1010\u103a",
      "\u1005\u1000\u103a\u1010\u1004\u103a\u1018\u102c",
      "\u1021\u1031\u102c\u1000\u103a\u1010\u102d\u102f\u1018\u102c",
      "\u1014\u102d\u102f\u101d\u1004\u103a\u1018\u102c",
      "\u1012\u102e\u1007\u1004\u103a\u1018\u102c"
    ],
    "WEEKENDRANGE": [
      5,
      6
    ],
    "fullDate": "EEEE d MMMM y",
    "longDate": "d MMMM y",
    "medium": "d MMM y HH:mm:ss",
    "mediumDate": "d MMM y",
    "mediumTime": "HH:mm:ss",
    "short": "dd-MM-yy HH:mm",
    "shortDate": "dd-MM-yy",
    "shortTime": "HH:mm"
  },
  "NUMBER_FORMATS": {
    "CURRENCY_SYM": "K",
    "DECIMAL_SEP": ".",
    "GROUP_SEP": ",",
    "PATTERNS": [
      {
        "gSize": 3,
        "lgSize": 3,
        "maxFrac": 3,
        "minFrac": 0,
        "minInt": 1,
        "negPre": "-",
        "negSuf": "",
        "posPre": "",
        "posSuf": ""
      },
      {
        "gSize": 3,
        "lgSize": 3,
        "maxFrac": 2,
        "minFrac": 2,
        "minInt": 1,
        "negPre": "-",
        "negSuf": "\u00a0\u00a4",
        "posPre": "",
        "posSuf": "\u00a0\u00a4"
      }
    ]
  },
  "id": "my",
  "localeID": "my",
  "pluralCat": function(n, opt_precision) {  return PLURAL_CATEGORY.OTHER;}
});
}]);