#!/usr/bin/env bash
source $(dirname $0)/config.sh

docker-compose build backend
docker-compose up --no-deps -d backend
