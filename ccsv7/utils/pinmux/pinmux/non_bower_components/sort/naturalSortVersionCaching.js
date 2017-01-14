/* global angular, _*/

/*!
 * Copyright 2013 Phil DeJarnett - http://www.overzealous.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Create a module for naturalSorting
angular.module("naturalSort", [])

// The core natural service
.factory("naturalService", function() {
	"use strict";
	// the cache prevents re-creating the values every time, at the expense of
	// storing the results forever. Not recommended for highly changing data
	// on long-term applications.
	var natCache = {},
		// amount of extra zeros to padd for sorting
		padding = function(value) {
			return "00000000000000000000".slice(value.length);
		},

		// Converts a value to a string.  Null and undefined are converted to ""
		toString = function(value) {
			if (value === null || value === undefined) return "";
			return "" + value;
		},

		// Fix numbers to be correctly padded
		fixNumbers = function(value) {
			// First, look for anything in the form of d.d or d.d.d...
			return toString(value).replace(/(\d+)((\.\d+)+)?/g, function($0, integer, decimal, $3) {
				// If there's more than 2 sets of numbers...
				if (decimal !== $3) {
					// treat as a series of integers, like versioning,
					// rather than a decimal
					return $0.replace(/(\d+)/g, function($d) {
						return padding($d) + $d;
					});
				} else {
					// add a decimal if necessary to ensure decimal sorting
					decimal = decimal || ".0";
					return padding(integer) + integer + decimal + padding(decimal);
				}
			});
		},

		// Finally, this function puts it all together.
		natValue = function(value) {
			if (natCache[value]) {
				return natCache[value];
			}
			natCache[value] = fixNumbers(value);
			return natCache[value];
		};

	// The actual object used by this service
	return {
		naturalValue: natValue,
		naturalSort: function(a, b) {
			a = natValue(a);
			b = natValue(b);
			return (a < b) ? -1 : ((a > b) ? 1 : 0);
		}
	};
})

// Attach a function to the rootScope so it can be accessed by "orderBy"
.run(["$rootScope", "naturalService", function($rootScope, naturalService) {
	"use strict";
	$rootScope.natural = function(field) {
		return function(item) {
			// TI CHANGE. The orignal version of the code does not support sorting function values.
			// This needs to be supported becuase some of our values are calculated on the fly view a function calls
			// as opposed to being normal object properties. i.e getDisplayName() for the various UI elemnts
			var propGetter = item[field];
			var value = _.isFunction(propGetter) ? propGetter.call(item) : propGetter;

			return naturalService.naturalValue(value);
		};
	};
}]);