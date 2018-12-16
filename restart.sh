#!/bin/bash
sudo service repka-lifeforce stop
git pull
sudo service repka-lifeforce start
sudo service repka-lifeforce status