#!/bin/bash
sudo service repka-lifeforce stop
git pull
npm ci
sudo service repka-lifeforce start
sudo service repka-lifeforce status
