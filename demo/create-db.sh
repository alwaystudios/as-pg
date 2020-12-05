#!/bin/bash

cd "$(dirname "$0")"

docker rm -f demo-db
docker build . -f Dockerfile -t pg-db
docker run --name demo-db -e POSTGRES_PASSWORD=test123 -p 5432:5432 -d pg-db
sleep 5
PSQL_DB=$(docker ps | grep demo-db | cut -d" " -f1)
docker exec -it $PSQL_DB psql -U postgres -c  "CREATE DATABASE demo"
