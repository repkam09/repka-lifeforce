## Lifeforce
This repository contains a collection of REST apis that are used to power various features of repkam09.com, cron scripts, logging services, server status services, and more.
This api system is expandable with simple 'plugins' that allow me to split out and separate different areas of the api from eachother.

The plugins are detected, validated, and started when the main lifeforce.js is run.

## Current Plugins and features
* Weather information
* Logging service
* Server heartbeat
* Upload files
* LastFM now playing music
* 2016 Presidential Election results (no longer dynamic, since election is over)
* Various other utilities


## More information
The live version of this api can be found running at https://api.repkam09.com/
A list of active endpoints can be found here: https://api.repkam09.com/api/about