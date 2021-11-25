#!/usr/bin/env bash
source $(dirname $0)/config.sh

docker-compose build db
docker-compose up -d db