(function() {
	"use strict";
	/*global angular,_,prettyPrintOne*/
	var explorerApp = angular.module("explorerApp", []);


	explorerApp.controller("MainController", MainController);

	MainController.$inject = ["$http", "$q"];

	function MainController($http, $q) {

		var os = ""; //win";
		var vm = this;

		vm.loading = false;

		var currentPromise = $q.resolve({});

		vm.getTopLevelData = function(filter) {
			vm.loading = true;
			currentPromise = $http.get("/ticloudagent/debug/" + os + "/;filter=" + filter).then(function(response) {
				vm.loading = false;
				var grouped = _.groupBy(response.data, function(resource) {
					return resource.name;
				});
				return grouped;
			}).then(function(resources) {
				vm.resources = resources;
			});
		};

		vm.getMetaDisplayVal = function(data) {
			var displayVal = JSON.stringify(data, null, "\t");
			return displayVal;
		};

		vm.getRaw = function(name, version) {
			version.showRaw = !version.showRaw;
			if (!vm.showRaw) {
				return $http.get(getContentUrl(name, version.version)).then(
					function(response) {
						version.data = response.data;
					});
			}
		};

		function removePrefix(path) {
			return path.replace("/TICloudAgent/", "");
		}

		vm.rawURL = getContentUrl;

		function getContentUrl(name, version) {
			return "/ticloudagent/debug/" + "/" + removePrefix(name) + ";version=" + version;
		}

	}

	if (!String.prototype.encodeHTML) {
		String.prototype.encodeHTML = function() {
			return this.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/"/g, "&quot;")
				.replace(/"/g, "&apos;");
		};
	}

	explorerApp.directive("prettyprint", function() {
		return {
			restrict: "C",
			scope: {
				version: "="
			},
			link: function postLink(scope, element) {
				scope.$watch("version.data", function(newValue, oldValue) {
					if (newValue !== oldValue) {
						element.html(prettyPrintOne(scope.version.data.encodeHTML()));
					}
				});
			}
		};
	});

})();