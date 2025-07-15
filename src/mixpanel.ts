import mixpanel from 'mixpanel-browser';

// Initialize Mixpanel
mixpanel.init(process.env.REACT_APP_MIXPANEL_TOKEN || '', {
  debug: process.env.NODE_ENV === 'development',
  track_pageview: true,
  persistence: 'localStorage'
});

// Analytics service
export const Analytics = {
  // Track page views
  trackPageView: (pageName: string) => {
    mixpanel.track('Page View', {
      page: pageName,
      timestamp: new Date().toISOString()
    });
  },

  // Track user actions
  trackEvent: (eventName: string, properties?: Record<string, any>) => {
    mixpanel.track(eventName, {
      ...properties,
      timestamp: new Date().toISOString()
    });
  },

  // Track user identification
  identify: (userId: string, userProperties?: Record<string, any>) => {
    mixpanel.identify(userId);
    if (userProperties) {
      mixpanel.people.set(userProperties);
    }
  },

  // Track user properties
  setUserProperties: (properties: Record<string, any>) => {
    mixpanel.people.set(properties);
  },

  // Track feature usage
  trackFeatureUsage: (featureName: string, properties?: Record<string, any>) => {
    mixpanel.track('Feature Used', {
      feature: featureName,
      ...properties,
      timestamp: new Date().toISOString()
    });
  },

  // Track goal-related events
  trackGoalEvent: (action: string, goalType: string, properties?: Record<string, any>) => {
    mixpanel.track('Goal Action', {
      action,
      goalType,
      ...properties,
      timestamp: new Date().toISOString()
    });
  },

  // Track quiz events
  trackQuizEvent: (action: string, properties?: Record<string, any>) => {
    mixpanel.track('Quiz Action', {
      action,
      ...properties,
      timestamp: new Date().toISOString()
    });
  },

  // Track job search events
  trackJobSearchEvent: (action: string, properties?: Record<string, any>) => {
    mixpanel.track('Job Search Action', {
      action,
      ...properties,
      timestamp: new Date().toISOString()
    });
  },

  // Track story events
  trackStoryEvent: (action: string, properties?: Record<string, any>) => {
    mixpanel.track('Story Action', {
      action,
      ...properties,
      timestamp: new Date().toISOString()
    });
  },

  // Track resume events
  trackResumeEvent: (action: string, properties?: Record<string, any>) => {
    mixpanel.track('Resume Action', {
      action,
      ...properties,
      timestamp: new Date().toISOString()
    });
  },

  // Track todo events
  trackTodoEvent: (action: string, properties?: Record<string, any>) => {
    mixpanel.track('Todo Action', {
      action,
      ...properties,
      timestamp: new Date().toISOString()
    });
  },

  // Track errors
  trackError: (error: string, context?: Record<string, any>) => {
    mixpanel.track('Error', {
      error,
      ...context,
      timestamp: new Date().toISOString()
    });
  },

  // Reset user
  reset: () => {
    mixpanel.reset();
  }
};

export default Analytics; 