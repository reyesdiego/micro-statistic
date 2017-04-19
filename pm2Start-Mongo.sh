#!/usr/bin/env bash
NODE_ENV=production PORT=10001 HOST=10.1.0.61 pm2 start --name Statistic-MONGO -i 3 mongo/statistic-service.js