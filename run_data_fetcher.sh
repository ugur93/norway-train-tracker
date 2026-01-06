#!/bin/bash

# Train Delay Data Fetcher Cron Job Script
# This script is designed to be run by cron for automated data collection

# Configuration
PROJECT_DIR="/home/ugur-cenar/Projects/norway-train-tracker"
LOG_FILE="$PROJECT_DIR/logs/cron.log"
PYTHON_EXECUTABLE="/usr/bin/python3"
SCRIPT_NAME="data_fetcher.py"

# Create logs directory if it doesn't exist
mkdir -p "$PROJECT_DIR/logs"

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Change to project directory
cd "$PROJECT_DIR" || {
    log_message "ERROR: Cannot change to project directory $PROJECT_DIR"
    exit 1
}

# Set database environment variables
export DB_USER="train_delays_user"
export DB_PASSWORD="train_delays_password"

# Log start of execution
log_message "Starting automated data fetch"

# Check if Python is available
if ! command -v "$PYTHON_EXECUTABLE" &> /dev/null; then
    log_message "ERROR: $PYTHON_EXECUTABLE not found"
    exit 1
fi

# Check if data fetcher script exists
if [ ! -f "$SCRIPT_NAME" ]; then
    log_message "ERROR: $SCRIPT_NAME not found in $PROJECT_DIR"
    exit 1
fi

# Run the data fetcher with database support
log_message "Running data fetcher with database integration"
"$PYTHON_EXECUTABLE" "$SCRIPT_NAME" --use-db >> "$LOG_FILE" 2>&1

# Check exit code
EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
    log_message "Data fetch completed successfully"
else
    log_message "ERROR: Data fetch failed with exit code $EXIT_CODE"
fi

# Optional: Clean up old log files (keep last 30 days)
find "$PROJECT_DIR/logs" -name "*.log" -type f -mtime +30 -delete

exit $EXIT_CODE