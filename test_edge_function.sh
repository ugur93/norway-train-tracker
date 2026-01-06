#!/bin/bash
# Test script for Supabase Edge Function

echo "🧪 Testing Supabase Edge Function"
echo "================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found"
    echo "Please create a .env file with your Supabase credentials:"
    echo "SUPABASE_URL=your_project_url"
    echo "SUPABASE_PUBLISHABLE_KEY=your_anon_key"
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Test the Edge Function
echo "🌐 Testing Edge Function..."
curl -X POST \
  -H "Authorization: Bearer $SUPABASE_PUBLISHABLE_KEY" \
  -H "Content-Type: application/json" \
  "$SUPABASE_URL/functions/v1/fetch-train-data" \
  -w "\nStatus: %{http_code}\nTime: %{time_total}s\n"

echo ""
echo "✅ Test completed. Check the response above."