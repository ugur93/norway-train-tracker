#!/bin/bash

# Cron Job Setup Script for Train Delay Dashboard
# This script helps set up automated data collection using cron

# Configuration
PROJECT_DIR="/home/ugur-cenar/Projects/norway-train-tracker"
CRON_SCRIPT="$PROJECT_DIR/run_data_fetcher.sh"
LOG_FILE="$PROJECT_DIR/logs/cron_setup.log"

# Create logs directory
mkdir -p "$PROJECT_DIR/logs"

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_message "Starting cron job setup for Train Delay Dashboard"

# Check if cron is available
if ! command -v crontab &> /dev/null; then
    log_message "ERROR: crontab command not found. Please install cron on your system."
    log_message "macOS: cron is built-in"
    log_message "Ubuntu/Debian: sudo apt install cron"
    exit 1
fi

# Check if the script exists and is executable
if [ ! -x "$CRON_SCRIPT" ]; then
    log_message "ERROR: Cron script $CRON_SCRIPT not found or not executable"
    log_message "Please run: chmod +x $CRON_SCRIPT"
    exit 1
fi

# Function to add cron job
add_cron_job() {
    local frequency=$1
    local cron_expression=""

    case $frequency in
        "30min")
            cron_expression="*/30 * * * *"
            ;;
        "hourly")
            cron_expression="0 * * * *"
            ;;
        "daily")
            cron_expression="0 2 * * *"
            ;;
        *)
            log_message "ERROR: Invalid frequency. Use: 30min, hourly, or daily"
            return 1
            ;;
    esac

    # Create the cron job entry
    local cron_job="$cron_expression $CRON_SCRIPT"

    # Check if cron job already exists
    if crontab -l 2>/dev/null | grep -q "$CRON_SCRIPT"; then
        log_message "Cron job already exists. Removing old entry..."
        crontab -l 2>/dev/null | grep -v "$CRON_SCRIPT" | crontab -
    fi

    # Add the new cron job
    (crontab -l 2>/dev/null; echo "$cron_job") | crontab -

    if [ $? -eq 0 ]; then
        log_message "✅ Cron job added successfully: $cron_job"
        log_message "The data fetcher will run $frequency"
        return 0
    else
        log_message "❌ Failed to add cron job"
        return 1
    fi
}

# Function to remove cron job
remove_cron_job() {
    if crontab -l 2>/dev/null | grep -q "$CRON_SCRIPT"; then
        crontab -l 2>/dev/null | grep -v "$CRON_SCRIPT" | crontab -
        log_message "✅ Cron job removed successfully"
    else
        log_message "No cron job found to remove"
    fi
}

# Function to list current cron jobs
list_cron_jobs() {
    log_message "Current cron jobs:"
    if crontab -l 2>/dev/null | grep -q "$CRON_SCRIPT"; then
        crontab -l 2>/dev/null | grep "$CRON_SCRIPT"
    else
        log_message "No train delay cron jobs found"
    fi
}

# Main menu
show_menu() {
    echo ""
    echo "🚂 Train Delay Dashboard - Cron Job Setup"
    echo "=========================================="
    echo "1. Add cron job (runs every 30 minutes)"
    echo "2. Add cron job (runs every hour)"
    echo "3. Add cron job (runs daily at 2 AM)"
    echo "4. Remove cron job"
    echo "5. List current cron jobs"
    echo "6. Test cron script manually"
    echo "7. Exit"
    echo ""
    read -p "Choose an option (1-7): " choice
}

# Main loop
while true; do
    show_menu

    case $choice in
        1)
            add_cron_job "30min"
            ;;
        2)
            add_cron_job "hourly"
            ;;
        3)
            add_cron_job "daily"
            ;;
        4)
            remove_cron_job
            ;;
        5)
            list_cron_jobs
            ;;
        6)
            log_message "Testing cron script manually..."
            if "$CRON_SCRIPT"; then
                log_message "✅ Manual test completed successfully"
            else
                log_message "❌ Manual test failed"
            fi
            ;;
        7)
            log_message "Exiting cron setup"
            exit 0
            ;;
        *)
            log_message "Invalid option. Please choose 1-7."
            ;;
    esac

    echo ""
    read -p "Press Enter to continue..."
done