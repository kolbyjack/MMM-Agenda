# Module: MMM-Agenda
The module allows you to view calendar events in a list.  Inspired by [MMM-Todoist](https://github.com/cbrooker/MMM-Todoist).

## Installation

In your terminal, go to your MagicMirror's Module folder:
````
cd ~/MagicMirror/modules
````

Clone this repository:
````
git clone https://github.com/kolbyjack/MMM-Agenda.git
````

Configure the module in your `config.js` file.

**Note:** After starting the Mirror, it will take a few seconds before the events start to appear.

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:
````javascript
modules: [
  {
    module: "MMM-Agenda",
    position: "top_left",
    config: { // See "Configuration options" for more information.
      showPastEvents: true,
      calendars: {
        "holidays": {
          hide: true
        },
        "importantStuff": {
          showPastEvents: true
        }
      }
    }
  }
]
````

## Configuration options

The following properties can be configured:

|Option|Default|Description|
|---|---|---|
|`maximumEntries`|`10`|The maximum number of events to show in the list.|
|`maxTitleLength`|`25`|The maximum number of characters to show on one line from an event's title.  If `wrapEvents` is set to true, then the remaining characters will be wrapped to subsequent lines.|
|`wrapEvents`|`false`|Whether to display the full title of events with names that exceed `maxTitleLength` characters on multiple lines.|
|`animationSpeed`|`2000`|The animation speed used when performing a dom update.|
|`fade`|`true`|Whether to progressively fade the text for events past `fadePoint`.|
|`fadePoint`|`0.25`|How far down the list of events to begin fading the text.|
|`timeFormat`|`12`|The format to use when displaying times.  Valid values are `12` and `24`.|
|`titleReplace`|{}|Map of words to replace in event titles.|
|`showPastEvents`|`false`|Whether to show past events by default.  `broadcastPastEvents` must also be set in your [calendar](https://docs.magicmirror.builders/modules/calendar.html#calendar-configuration-options) module configuration.|
|`showRepeatEvents`|`true`|Whether to display all instances of repeated events, or just the first instance.|
|`calendars`|`{}`|Calendar-specific overrides.  Keys are matched against the `name` value set in your [calendar](https://docs.magicmirror.builders/modules/calendar.html#calendar-configuration-options) module configuration.  For each calendar, you can set `hide: true` to hide it, or override the default value of `showPastEvents`.|
