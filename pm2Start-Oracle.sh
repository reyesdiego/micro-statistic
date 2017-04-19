#!/usr/bin/env bash
NODE_ENV=production PORT=10002 HOST=10.1.0.61 pm2 start --name Statistic-ORACLE -i 3 oracle/statistic-service.js