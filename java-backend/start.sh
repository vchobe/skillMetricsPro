#!/bin/bash

echo "Starting Spring Boot backend application..."
./mvnw spring-boot:run

if [ $? -ne 0 ]; then
    echo "Failed to start Spring Boot application. Check errors above."
    exit 1
fi