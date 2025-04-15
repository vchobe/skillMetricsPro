#!/bin/bash

# Change to the Java backend directory
cd java-backend

# Find all Java files containing javax.persistence
echo "Fixing javax.persistence imports..."
find src -type f -name "*.java" -exec sed -i 's/javax\.persistence/jakarta.persistence/g' {} \;

# Find all Java files containing javax.validation
echo "Fixing javax.validation imports..."
find src -type f -name "*.java" -exec sed -i 's/javax\.validation/jakarta.validation/g' {} \;

# Find all Java files containing javax.mail
echo "Fixing javax.mail imports..."
find src -type f -name "*.java" -exec sed -i 's/javax\.mail/jakarta.mail/g' {} \;

# Find all Java files containing javax.servlet
echo "Fixing javax.servlet imports..."
find src -type f -name "*.java" -exec sed -i 's/javax\.servlet/jakarta.servlet/g' {} \;

# Find all Java files containing javax.transaction
echo "Fixing javax.transaction imports..."
find src -type f -name "*.java" -exec sed -i 's/javax\.transaction/jakarta.transaction/g' {} \;

# Find all Java files containing javax.annotation
echo "Fixing javax.annotation imports..."
find src -type f -name "*.java" -exec sed -i 's/javax\.annotation/jakarta.annotation/g' {} \;

echo "Import conversion complete!"