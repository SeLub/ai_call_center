#!/bin/bash
# Script to start the validation framework

# Kill any existing validation framework processes
pkill -f "node src/index.js" 2>/dev/null || true

# Wait a moment for processes to terminate
sleep 2

# Start the validation framework
cd /home/selub/Documents/progs/ai_call_center/validation-framework
node src/index.js &

echo "Validation framework started. Rule management API should be available on port 302."