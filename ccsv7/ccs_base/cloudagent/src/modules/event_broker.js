/*jslint node: true */
"use strict";

var Q = require("q");

var createModule = require("../module").createModule;

var newPromise = Q;

function addCommands(eventBroker) {

	var registeredData = {};

	function fireEvent(eventName, data) {
		eventBroker.triggerEvent(eventName, {
			data: data
		});
		return newPromise();
	}

	function registerData(dataName, data) {
		registeredData[dataName] = data;
		return newPromise();
	}

	function fetchData(dataName) {
		var data = registeredData[dataName];
		if (data) {
			return newPromise({
				data: data
			});
		}
		return Q.reject("No data is registered under " + dataName);
	}

	eventBroker.commands.fireEvent = fireEvent;
	eventBroker.commands.registerData = registerData;
	eventBroker.commands.fetchData = fetchData;
}

module.exports = {

	name: "EventBroker",

	create: function create(onClose) {

		return createModule(this.name, onClose)
			.then(function moduleCreated(eventBroker) {

				addCommands(eventBroker);

				return {
					port: eventBroker.getPort()
				};
			});
	}
};