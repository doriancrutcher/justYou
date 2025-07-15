import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Header from './components/Header';
import Home from './pages/Home';
import CreatePost from './pages/CreatePost';
import ViewPost from './pages/ViewPost';
import TodoList from './pages/TodoList';
import EditPost from './pages/EditPost';
import GoalsPage from './pages/GoalsPage';
import ResumeObjective from './pages/ResumeObjective';
import JobSearchTracker from './pages/JobSearchTracker';
import QuizGenerator from './pages/QuizGenerator';
import Resources from './pages/Resources';
import StoriesPage from './pages/StoriesPage';
import { AuthProvider } from './components/AuthContext';
import { Analytics } from './mixpanel';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
  },
});

// Component to track page views
const PageTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view
    Analytics.trackPageView(location.pathname);
    
    // Track specific page events
    const pageName = location.pathname === '/' ? 'Home' : 
                    location.pathname.slice(1).charAt(0).toUpperCase() + location.pathname.slice(2);
    
    Analytics.trackEvent('Page Visited', {
      page: pageName,
      path: location.pathname,
      search: location.search
    });
  }, [location]);

  return null;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <PageTracker />
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/stories" element={<StoriesPage />} />
            <Route path="/create" element={<CreatePost />} />
            <Route path="/post/:id" element={<ViewPost />} />
            <Route path="/todos" element={<TodoList />} />
            <Route path="/edit/:id" element={<EditPost />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/resume" element={<ResumeObjective />} />
            <Route path="/tracker" element={<JobSearchTracker />} />
            <Route path="/quiz" element={<QuizGenerator />} />
            <Route path="/resources" element={<Resources />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
