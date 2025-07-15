import mixpanel from 'mixpanel-browser';

// Check if Mixpanel token is available
const MIXPANEL_TOKEN = process.env.REACT_APP_MIXPANEL_TOKEN;

// Initialize Mixpanel only if token is available
if (MIXPANEL_TOKEN && MIXPANEL_TOKEN.trim() !== '') {
  try {
    mixpanel.init(MIXPANEL_TOKEN, {
      debug: process.env.NODE_ENV === 'development',
      track_pageview: true,
      persistence: 'localStorage'
    });
  } catch (error) {
    console.warn('Failed to initialize Mixpanel:', error);
  }
}

// Analytics service with fallback behavior
export const Analytics = {
  // Check if Mixpanel is available
  isAvailable: () => {
    return MIXPANEL_TOKEN && MIXPANEL_TOKEN.trim() !== '' && typeof mixpanel !== 'undefined';
  },

  // Track page views
  trackPageView: (pageName: string) => {
    if (!Analytics.isAvailable()) return;
    
    try {
      mixpanel.track('Page View', {
        page: pageName,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to track page view:', error);
    }
  },

  // Track user actions
  trackEvent: (eventName: string, properties?: Record<string, any>) => {
    if (!Analytics.isAvailable()) return;
    
    try {
      mixpanel.track(eventName, {
        ...properties,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to track event:', error);
    }
  },

  // Track user identification
  identify: (userId: string, userProperties?: Record<string, any>) => {
    if (!Analytics.isAvailable()) return;
    
    try {
      mixpanel.identify(userId);
      if (userProperties) {
        mixpanel.people.set(userProperties);
      }
    } catch (error) {
      console.warn('Failed to identify user:', error);
    }
  },

  // Track user properties
  setUserProperties: (properties: Record<string, any>) => {
    if (!Analytics.isAvailable()) return;
    
    try {
      mixpanel.people.set(properties);
    } catch (error) {
      console.warn('Failed to set user properties:', error);
    }
  },

  // Track feature usage
  trackFeatureUsage: (featureName: string, properties?: Record<string, any>) => {
    if (!Analytics.isAvailable()) return;
    
    try {
      mixpanel.track('Feature Used', {
        feature: featureName,
        ...properties,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to track feature usage:', error);
    }
  },

  // Track goal-related events
  trackGoalEvent: (action: string, goalType: string, properties?: Record<string, any>) => {
    if (!Analytics.isAvailable()) return;
    
    try {
      mixpanel.track('Goal Action', {
        action,
        goalType,
        ...properties,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to track goal event:', error);
    }
  },

  // Track quiz events
  trackQuizEvent: (action: string, properties?: Record<string, any>) => {
    if (!Analytics.isAvailable()) return;
    
    try {
      mixpanel.track('Quiz Action', {
        action,
        ...properties,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to track quiz event:', error);
    }
  },

  // Track job search events
  trackJobSearchEvent: (action: string, properties?: Record<string, any>) => {
    if (!Analytics.isAvailable()) return;
    
    try {
      mixpanel.track('Job Search Action', {
        action,
        ...properties,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to track job search event:', error);
    }
  },

  // Track story events
  trackStoryEvent: (action: string, properties?: Record<string, any>) => {
    if (!Analytics.isAvailable()) return;
    
    try {
      mixpanel.track('Story Action', {
        action,
        ...properties,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to track story event:', error);
    }
  },

  // Track resume events
  trackResumeEvent: (action: string, properties?: Record<string, any>) => {
    if (!Analytics.isAvailable()) return;
    
    try {
      mixpanel.track('Resume Action', {
        action,
        ...properties,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to track resume event:', error);
    }
  },

  // Track todo events
  trackTodoEvent: (action: string, properties?: Record<string, any>) => {
    if (!Analytics.isAvailable()) return;
    
    try {
      mixpanel.track('Todo Action', {
        action,
        ...properties,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to track todo event:', error);
    }
  },

  // Track errors
  trackError: (error: string, context?: Record<string, any>) => {
    if (!Analytics.isAvailable()) return;
    
    try {
      mixpanel.track('Error', {
        error,
        ...context,
        timestamp: new Date().toISOString()
      });
    } catch (trackingError) {
      console.warn('Failed to track error:', trackingError);
    }
  },

  // Reset user
  reset: () => {
    if (!Analytics.isAvailable()) return;
    
    try {
      mixpanel.reset();
    } catch (error) {
      console.warn('Failed to reset user:', error);
    }
  }
};

export default Analytics; 