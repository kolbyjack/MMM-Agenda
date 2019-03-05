/* global Module */

/* Magic Mirror
 * Module: MMM-Agenda
 *
 * By Jon Kolb
 * Based on the Calendar module by Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

Module.register("MMM-Agenda", {

	// Define module defaults
	defaults: {
		maximumEntries: 10, // Total Maximum Entries
		maximumNumberOfDays: 365,
		maxTitleLength: 25,
		wrapEvents: false, // wrap events to multiple lines breaking at maxTitleLength
		animationSpeed: 2000,
		fade: true,
		timeFormat: 12,
		fadePoint: 0.25, // Start on 1/4th of the list.
		calendars: [],
		titleReplace: {},
		showPastEvents: false,
		showRepeatEvents: true,
	},

	getStyles: function () {
		return ["MMM-Agenda.css"];
	},

	start: function () {
		Log.log("Starting module: " + this.name);

		this.events = [];
		this.loaded = false;
	},

	notificationReceived: function(notification, payload, sender) {
		var self = this;

		if (notification === "CALENDAR_EVENTS") {
			var now = new Date();

			self.events = payload.map(e => {
				e.startDate = new Date(+e.startDate);
				e.endDate = new Date(+e.endDate);
				if (e.fullDayEvent) {
					e.endDate = new Date(e.endDate.getTime() - 1000);
				}
				return e;
			}).filter(e => {
				var showPastEvents = self.getCalendarProperty(e.calendarName, "showPastEvents", self.config.showPastEvents);
				return showPastEvents || e.endDate > now;
			}).slice(0, self.config.maximumEntries);

			self.loaded = true;
		}

		self.updateDom(self.config.animationSpeed);
	},

	// Override dom generator.
	getDom: function () {

		var events = this.events;
		var wrapper = document.createElement("table");
		wrapper.className = "small";

		if (events.length === 0) {
			wrapper.innerHTML = (this.loaded) ? this.translate("EMPTY") : this.translate("LOADING");
			wrapper.className = "small dimmed";
			return wrapper;
		}

		for (var e in events) {
			var event = events[e];
			var eventWrapper = document.createElement("tr");

			var titleWrapper = document.createElement("td");
			titleWrapper.innerHTML = this.titleTransform(event.title);
			titleWrapper.className = "title bright";

			eventWrapper.appendChild(titleWrapper);

			var timeWrapper = document.createElement("td");
			var now = new Date();
			var oneDay = 24 * 60 * 60 * 1000;
			var startDateTime = event.startDate;
			var startDate = new Date(startDateTime.getFullYear(), startDateTime.getMonth(), startDateTime.getDate());
			var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			var diffDays = Math.floor((startDate - today + 7200000) / (oneDay));
			var diffMonths = (startDate.getFullYear() * 12 + startDate.getMonth()) - (now.getFullYear() * 12 + now.getMonth());

			timeWrapper.className = "time bright ";
			if (diffDays < -1) {
				eventWrapper.className = "xsmall";
				timeWrapper.innerHTML = startDate.toLocaleDateString(config.language, {"month": "short"}) + " " + startDate.getDate();
				timeWrapper.className += "overdue";
			} else if (diffDays === -1) {
				eventWrapper.className = "xsmall";
				timeWrapper.innerHTML = this.translate("Yesterday");
				timeWrapper.className += "overdue";
			} else if (diffDays === 0) {
				eventWrapper.className = "normal";
				timeWrapper.innerHTML = this.translate("TODAY");
				if (event.fullDayEvent || event.endDate >= now) {
					timeWrapper.className += "today";
				} else {
					timeWrapper.className += "overdue";
				}
			} else if (diffDays === 1) {
				eventWrapper.className = "xsmall";
				timeWrapper.innerHTML = this.translate("TOMORROW");
				timeWrapper.className += "tomorrow";
			} else if (diffDays < 7) {
				eventWrapper.className = "xsmall";
				timeWrapper.innerHTML = startDate.toLocaleDateString(config.language, {"weekday": "short"});
			} else if (diffMonths < 7 || startDate.getFullYear() == now.getFullYear()) {
				eventWrapper.className = "xsmall";
				timeWrapper.innerHTML = startDate.toLocaleDateString(config.language, {"month": "short"}) + " " + startDate.getDate();
			} else {
				eventWrapper.className = "xsmall";
				timeWrapper.innerHTML = startDate.toLocaleDateString(config.language, {"month": "short"}) + " " + startDate.getDate() + " " + startDate.getFullYear();
			}

			if (timeWrapper.innerHTML !== "" && !event.fullDayEvent) {
				function formatTime(d) {
					function z(n) {
						return (n < 10 ? "0" : "") + n;
					}
					var h = d.getHours();
					var m = z(d.getMinutes());
					if (config.timeFormat === 12) {
						return (h % 12 || 12) + ":" + m + (h < 12 ? " AM" : " PM");
					} else {
						return h + ":" + m;
					}
				}
				if (diffDays == 0) {
					timeWrapper.innerHTML = formatTime(startDateTime);
				} else {
					timeWrapper.innerHTML += " " + formatTime(startDateTime);
				}
			}
			eventWrapper.appendChild(timeWrapper);

			wrapper.appendChild(eventWrapper);

			// Create fade effect.
			if (this.config.fade && this.config.fadePoint < 1) {
				if (this.config.fadePoint < 0) {
					this.config.fadePoint = 0;
				}
				var startingPoint = events.length * this.config.fadePoint;
				var steps = events.length - startingPoint;
				if (e >= startingPoint) {
					var currentStep = e - startingPoint;
					eventWrapper.style.opacity = 1 - (1 / steps * currentStep);
				}
			}
		}

		return wrapper;
	},

	/* getCalendarProperty(name, property, defaultValue)
	 * Helper method to retrieve the property for a specific name.
	 *
	 * argument name string - Name to look for.
	 * argument property string - Property to look for.
	 * argument defaultValue string - Value if property is not found.
	 *
	 * return string - The Property
	 */
	getCalendarProperty: function (name, property, defaultValue) {
		for (var c in this.config.calendars) {
			var calendar = this.config.calendars[c];
			if (calendar.name === name && calendar.hasOwnProperty(property)) {
				return calendar[property];
			}
		}

		return defaultValue;
	},

	/**
	 * Shortens a string if it's longer than maxLength and add a ellipsis to the end
	 *
	 * @param {string} string Text string to shorten
	 * @param {number} maxLength The max length of the string
	 * @param {boolean} wrapEvents Wrap the text after the line has reached maxLength
	 * @returns {string} The shortened string
	 */
	shorten: function (string, maxLength, wrapEvents) {
		if (typeof string !== "string") {
			return "";
		}

		if (wrapEvents === true) {
			var temp = "";
			var currentLine = "";
			var words = string.split(" ");

			for (var i = 0; i < words.length; i++) {
				var word = words[i];
				if (currentLine.length + word.length < (typeof maxLength === "number" ? maxLength : 25) - 1) { // max - 1 to account for a space
					currentLine += (word + " ");
				} else {
					if (currentLine.length > 0) {
						temp += (currentLine + "<br>" + word + " ");
					} else {
						temp += (word + "<br>");
					}
					currentLine = "";
				}
			}

			return (temp + currentLine).trim();
		} else {
			if (maxLength && typeof maxLength === "number" && string.length > maxLength) {
				return string.trim().slice(0, maxLength) + "&hellip;";
			} else {
				return string.trim();
			}
		}
	},

	/* capFirst(string)
	 * Capitalize the first letter of a string
	 * Return capitalized string
	 */

	capFirst: function (string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	},

	/* titleTransform(title)
	 * Transforms the title of an event for usage.
	 * Replaces parts of the text as defined in config.titleReplace.
	 * Shortens title based on config.maxTitleLength and config.wrapEvents
	 *
	 * argument title string - The title to transform.
	 *
	 * return string - The transformed title.
	 */
	titleTransform: function (title) {
		for (var needle in this.config.titleReplace) {
			var replacement = this.config.titleReplace[needle];

			var regParts = needle.match(/^\/(.+)\/([gim]*)$/);
			if (regParts) {
			  // the parsed pattern is a regexp.
			  needle = new RegExp(regParts[1], regParts[2]);
			}

			title = title.replace(needle, replacement);
		}

		title = this.shorten(title, this.config.maxTitleLength, this.config.wrapEvents);
		return title;
	}
});
