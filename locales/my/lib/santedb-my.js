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
SanteDB.locale.dateFormats = {
    year: 'YYYY',
    month: 'YYYY-MM',
    day: 'DD MM YYYY',
    hour: 'DD MM YYYY HH',
    minute: 'DD MM YYYY HH:mm',
    second: 'DD MM YYYY HH:mm:ss',
    human: {
        month: 'MMMM, YYYY',
        day: 'dddd MMMM D, YYYY',
        hour: 'dddd MMMM D, YYYY [at] hh A',
        minute: 'dddd MMMM D, YYYY [at] hh:mm A'
    }
}

SanteDB.display.setPreferredNameType("Phonetic");