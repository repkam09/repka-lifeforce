#!/bin/bash
sudo service repka-lifeforce stop
git pull
npm install 
sudo service repka-lifeforce start
sudo service repka-lifeforce status
