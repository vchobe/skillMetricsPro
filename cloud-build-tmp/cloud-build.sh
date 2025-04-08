#!/bin/bash
# Build the app
npm run build

# Extra fixes on the compiled JavaScript
echo "Applying port 8080 fixes to compiled JavaScript..."
sed -i 's/const port = process.env.PORT/const port = 8080/g' ./dist/index.js
sed -i 's/parseInt(process.env.PORT, 10) : 5000/8080/g' ./dist/index.js
sed -i 's/log(`serving on ${host}:${port}`)/log(`serving on port 8080`)/g' ./dist/index.js
sed -i 's/const {PORT/const {_PORT/g' ./dist/index.js

# Print the result
echo "Final port configuration in dist/index.js:"
grep -n "port" ./dist/index.js
