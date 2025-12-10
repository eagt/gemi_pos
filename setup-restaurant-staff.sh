#!/bin/bash

# Restaurant Staff System Setup Script
# This script helps you set up the restaurant staff system

echo "🍽️  Restaurant Staff System Setup"
echo "=================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found"
    echo "Please create .env.local with your Supabase credentials first"
    exit 1
fi

echo "✅ Found .env.local file"
echo ""

# Display migration file location
echo "📋 Migration File Location:"
echo "   migration_restaurant_staff_system.sql"
echo ""

echo "📝 Next Steps:"
echo ""
echo "1. Open your Supabase project dashboard"
echo "   https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql"
echo ""
echo "2. Copy the contents of migration_restaurant_staff_system.sql"
echo ""
echo "3. Paste into the SQL Editor and click 'Run'"
echo ""
echo "4. Verify the migration completed successfully"
echo ""
echo "5. Test the system by creating a new table_order business"
echo ""

# Offer to open the migration file
echo "Would you like to view the migration file now? (y/n)"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    if command -v cat &> /dev/null; then
        echo ""
        echo "=== Migration File Contents ==="
        cat migration_restaurant_staff_system.sql
        echo ""
        echo "=== End of Migration File ==="
    else
        echo "Opening migration file..."
        open migration_restaurant_staff_system.sql 2>/dev/null || xdg-open migration_restaurant_staff_system.sql 2>/dev/null || echo "Please open migration_restaurant_staff_system.sql manually"
    fi
fi

echo ""
echo "📚 For detailed documentation, see:"
echo "   RESTAURANT_STAFF_SYSTEM.md"
echo ""
echo "🚀 After migration, start your dev server:"
echo "   npm run dev"
echo ""
echo "✨ Happy coding!"
