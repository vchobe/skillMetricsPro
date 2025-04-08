#!/bin/bash

echo "Building Spring Boot backend application..."
./mvnw clean package -DskipTests

if [ $? -eq 0 ]; then
    echo "Build successful! JAR file is in target/ directory"
else
    echo "Build failed. Check errors above."
    exit 1
fi
