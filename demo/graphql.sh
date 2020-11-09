#!/bin/bash

npx postgraphile -c postgres://postgres:test123@localhost:5432/demo --watch --enhance-graphiql --dynamic-json
