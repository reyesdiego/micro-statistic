#!/usr/bin/env bash
NODE_ENV=development PORT=10002 HOST=10.10.0.223 pm2 start --name Statistic-ORACLE -i 3 oracle/statistic-service.js