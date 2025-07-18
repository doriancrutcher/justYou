#!/bin/bash

# Deploy Firebase Security Rules
echo "🚀 Deploying Firebase Security Rules..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please login first:"
    echo "firebase login"
    exit 1
fi

# Deploy Firestore rules
echo "📝 Deploying Firestore rules..."
firebase deploy --only firestore:rules

# Deploy Storage rules
echo "📁 Deploying Storage rules..."
firebase deploy --only storage:rules

echo "✅ Security rules deployed successfully!"
echo ""
echo "🔒 Your Firebase project is now secured with:"
echo "   • User authentication required for all operations"
echo "   • Users can only access their own data"
echo "   • File uploads restricted to PDF, images, and text files"
echo "   • File size limited to 10MB"
echo "   • All other access denied by default" 