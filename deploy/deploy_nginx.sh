#!/usr/bin/env bash
source $(dirname $0)/config.sh

docker-compose build nginx-proxy
docker-compose up -d nginx-proxy