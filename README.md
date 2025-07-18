# JobGoalz

A comprehensive career development and job search tracking application built with React, TypeScript, Firebase, and Claude AI.

## Features

- **AI-Powered Quiz Generator**: Create custom quizzes from your notes with difficulty levels
- **Job Search Tracker**: Monitor your job search activities and time spent
- **Goals Management**: Organize and track career goals with drag-and-drop reordering
- **Resume Optimizer**: Get AI-powered suggestions for resume sections
- **Story Management**: Create and manage professional stories for interviews
- **Todo Lists**: Simple task management for career development
- **Resources**: Curated learning materials and career resources

## Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase project
- Claude API access

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd justYou
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id

# Claude API Configuration
REACT_APP_CLAUDE_API_KEY=your_claude_api_key
REACT_APP_CLAUDE_PROXY_URL=http://localhost:3001

# Admin Configuration
REACT_APP_ADMIN_EMAIL=your_admin_email@example.com

# Mixpanel Analytics (Optional)
REACT_APP_MIXPANEL_TOKEN=your_mixpanel_project_token
```

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with Google sign-in
3. Create a Firestore database
4. Set up security rules for Firestore
5. Add your Firebase configuration to the `.env` file

### Claude API Setup

1. Get your Claude API key from [Anthropic Console](https://console.anthropic.com/)
2. Set up the Claude proxy server (see `claude-backend/` directory)
3. Add your API key to the `.env` file

### Mixpanel Analytics Setup (Optional)

1. Create a Mixpanel project at [Mixpanel](https://mixpanel.com/)
2. Get your project token from the project settings
3. Add the token to your `.env` file as `REACT_APP_MIXPANEL_TOKEN`

The app will automatically track:
- User authentication events
- Page views and navigation
- Feature usage across all pages
- Goal management actions (create, delete, reorder)
- Quiz generation and grading
- Job search activity tracking
- Error events and debugging information

### Running the Application

1. Start the development server:
```bash
npm start
```

2. Start the Claude backend server (in a separate terminal):
```bash
cd claude-backend
npm install
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Analytics Tracking

The application includes comprehensive analytics tracking via Mixpanel:

### User Events Tracked

- **Authentication**: Sign in/out, user identification
- **Page Views**: All page visits with navigation data
- **Feature Usage**: Usage of each major feature
- **Goal Management**: Create, delete, reorder goals and categories
- **Quiz Generation**: Quiz creation, grading, difficulty settings
- **Job Search**: Activity tracking, time logging
- **Error Tracking**: All errors with context for debugging

### Analytics Data Structure

All events include:
- Timestamp
- User ID (when authenticated)
- Page context
- Feature-specific data
- Error details (when applicable)

### Privacy Considerations

- User data is anonymized when possible
- No sensitive information is tracked
- Analytics can be disabled by removing the Mixpanel token
- All tracking is transparent and documented

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Netlify

1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Add environment variables in Netlify dashboard

### Deploy to Vercel

1. Connect your repository to Vercel
2. Set build command: `npm run build`
3. Add environment variables in Vercel dashboard

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
