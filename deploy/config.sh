#!/usr/bin/env bash
USER=root
HOST=flamingoapp.org
# PRIVATE_KEY=$(dirname $0)/server-credentials/marketplace-prj.pem

export DOCKER_HOST=ssh://$USER@$HOST

# chmod 400 $PRIVATE_KEY
# ssh-add $PRIVATE_KEY