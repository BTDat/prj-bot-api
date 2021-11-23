#!/usr/bin/env bash
source $(dirname $0)/config.sh

docker-compose build acme-companion
docker-compose up -d acme-companion