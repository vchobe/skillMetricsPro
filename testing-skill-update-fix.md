# Testing the Skill Update Fix

Due to limitations in Replit with running both Java and Node.js servers simultaneously in a workflow, follow these manual steps to test the skill update fix:

## Option 1: Using the java-mode.sh Script

1. Open the Replit Shell by clicking on the Shell tab
2. Run the java-mode script:
   ```bash
   ./java-mode.sh
   ```
3. This will:
   - Start a mock Java backend on port 8080
   - Start the frontend in Java-compatibility mode on port 5000

4. After the servers are running, you should see:
   ```
   ===========================================
   Mock Java Backend running on port 8080
   This simulates the Java Spring Boot API
   ===========================================
   
   ===============================================
   Starting Frontend in Java Mode
   ===============================================
   The frontend will run on port 5000
   API requests will be sent to mock Java backend on port 8080
   
   [...]
   
   Detected Java backend running on port 8080
   Java backend detected on port 8080
   Starting in frontend-only mode on port 5000
   API proxy configured to forward requests to Java backend on port 8080
   ```

5. You can now test the skill update functionality:
   - Open the Webview tab (it should load the frontend on port 5000)
   - Log in with any credentials (the mock Java backend accepts any login)
   - Navigate to the Skills section
   - Try creating and updating skills

## Option 2: Test API Functionality Directly

If you just want to test the API functionality:

1. Start the mock Java backend:
   ```bash
   node mock-java-backend.js &
   ```

2. Run the API test script:
   ```bash
   ./run-skill-update-test.sh
   ```

3. This will run a series of API tests against the mock Java backend:
   - Create a skill with PUT
   - Update a skill with PATCH (Node.js style)
   - Update a skill with PUT (Java style)
   - Create a pending update
   - Get pending updates (using both Node.js and Java endpoints)

## Verifying the Fix

The fix is working correctly if:

1. Skills can be created and updated using both:
   - PUT requests (Java style)
   - PATCH requests (Node.js style)

2. Pending updates work with both:
   - `/api/skills/pending` endpoint (Node.js style)
   - `/api/pending-updates` endpoint (Java style)

3. Field naming is handled correctly:
   - snake_case fields work (Node.js style)
   - camelCase fields work (Java style)

## Shutting Down

To stop the servers:

1. If using the java-mode.sh script:
   - Press Ctrl+C in the Shell tab to stop both servers

2. If running servers manually:
   - Use `pkill -f "node"` to kill all Node.js processes