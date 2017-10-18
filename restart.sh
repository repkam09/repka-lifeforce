#!/bin/bash
pm2 stop lifeforce && git pull && pm2 flush && pm2 start lifeforce && pm2 logs lifeforce