# Lifeforce

This repository contains a collection of REST apis that are used to power various features of repkam09.com, cron scripts, logging services, server status services, and more.
This api system is expandable with simple 'plugins' that allow me to split out and separate different areas of the api from eachother.

Upgraded to use TypeScript and Koa for better type safety and performance in Nov 2024.

## Running and Debugging

There are systemd service files included as an example, configured for my own personal usage, that allow this to be run continuously.

However, development is easier running as a normal nodejs app through vscode or directly through `npm run build` and `npm run start`.

## Config Files

An example .env file is included in this repository, and is used to store sensitive information.

## Current Plugins and features

- Weather information
- LastFM now playing music
- Various other utilities

## More information

The live version of this api can be found running at https://api.repkam09.com/
A list of active endpoints can be found here: https://api.repkam09.com/api/about
