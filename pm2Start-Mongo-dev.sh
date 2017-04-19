#!/usr/bin/env bash
NODE_ENV=development PORT=10001 HOST=10.10.0.223 pm2 start --name Statistic-Mongo -i 3 mongo/statistic-service.js