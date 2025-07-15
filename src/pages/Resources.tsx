import React from 'react';
import { 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Box, 
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { 
  School as SchoolIcon,
  Work as WorkIcon,
  Psychology as PsychologyIcon,
  TrendingUp as TrendingUpIcon,
  Launch as LaunchIcon
} from '@mui/icons-material';

const Resources: React.FC = () => {
  const resourceCategories = [
    {
      title: "Study Materials",
      description: "Essential resources for learning and skill development",
      icon: <SchoolIcon sx={{ fontSize: 40 }} />,
      color: "#1976d2",
      resources: [
        {
          title: "FreeCodeCamp",
          description: "Learn to code with free interactive tutorials",
          url: "https://www.freecodecamp.org/",
          type: "Coding Tutorials"
        },
        {
          title: "Khan Academy",
          description: "Free educational content across all subjects",
          url: "https://www.khanacademy.org/",
          type: "General Education"
        },
        {
          title: "Coursera",
          description: "Online courses from top universities",
          url: "https://www.coursera.org/",
          type: "University Courses"
        },
        {
          title: "edX",
          description: "High-quality courses from leading institutions",
          url: "https://www.edx.org/",
          type: "University Courses"
        }
      ]
    },
    {
      title: "Career Development",
      description: "Resources to advance your professional journey",
      icon: <WorkIcon sx={{ fontSize: 40 }} />,
      color: "#2e7d32",
      resources: [
        {
          title: "LinkedIn Learning",
          description: "Professional development courses and skills training",
          url: "https://www.linkedin.com/learning/",
          type: "Professional Skills"
        },
        {
          title: "Indeed Career Guide",
          description: "Career advice, resume tips, and job search strategies",
          url: "https://www.indeed.com/career-advice",
          type: "Career Advice"
        },
        {
          title: "Glassdoor Career Guide",
          description: "Salary insights, company reviews, and career tips",
          url: "https://www.glassdoor.com/blog/career-advice/",
          type: "Career Insights"
        },
        {
          title: "Harvard Business Review",
          description: "Management insights and leadership development",
          url: "https://hbr.org/",
          type: "Leadership"
        }
      ]
    },
    {
      title: "Mindset & Motivation",
      description: "Resources for mental strength and personal growth",
      icon: <PsychologyIcon sx={{ fontSize: 40 }} />,
      color: "#9c27b0",
      resources: [
        {
          title: "Mindset by Carol Dweck",
          description: "Understanding growth vs fixed mindset",
          url: "https://mindsetonline.com/",
          type: "Psychology"
        },
        {
          title: "Atomic Habits by James Clear",
          description: "Building good habits and breaking bad ones",
          url: "https://jamesclear.com/atomic-habits",
          type: "Habit Formation"
        },
        {
          title: "Deep Work by Cal Newport",
          description: "Focus and productivity in a distracted world",
          url: "https://calnewport.com/books/deep-work/",
          type: "Productivity"
        },
        {
          title: "Grit by Angela Duckworth",
          description: "The power of passion and perseverance",
          url: "https://angeladuckworth.com/grit-book/",
          type: "Psychology"
        }
      ]
    },
    {
      title: "Industry Insights",
      description: "Stay updated with industry trends and best practices",
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      color: "#ed6c02",
      resources: [
        {
          title: "TechCrunch",
          description: "Latest technology news and startup insights",
          url: "https://techcrunch.com/",
          type: "Technology News"
        },
        {
          title: "Medium",
          description: "Articles on technology, business, and personal development",
          url: "https://medium.com/",
          type: "Articles"
        },
        {
          title: "Product Hunt",
          description: "Discover new products and tools",
          url: "https://www.producthunt.com/",
          type: "Product Discovery"
        },
        {
          title: "Stack Overflow",
          description: "Developer community and technical Q&A",
          url: "https://stackoverflow.com/",
          type: "Developer Community"
        }
      ]
    }
  ];

  const dailyTips = [
    "Set specific, measurable goals for each study session",
    "Use the Pomodoro Technique: 25 minutes focused work, 5 minutes break",
    "Review and reflect on what you learned at the end of each day",
    "Connect new information to what you already know",
    "Practice active recall instead of passive re-reading",
    "Teach others what you've learned to reinforce your understanding",
    "Take regular breaks to maintain focus and prevent burnout",
    "Celebrate small wins to maintain motivation"
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        📚 Learning Resources
      </Typography>
      <Typography variant="h6" color="text.secondary" align="center" sx={{ mb: 4 }}>
        Curated resources to accelerate your career growth
      </Typography>

      {/* Daily Study Tips */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, backgroundColor: '#f8f9fa' }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
          💡 Daily Study Tips
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
          {dailyTips.map((tip, index) => (
            <Box key={index}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', p: 1 }}>
                <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  backgroundColor: '#1976d2',
                  mt: 1,
                  mr: 2
                }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {tip}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Resource Categories */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
        {resourceCategories.map((category, index) => (
          <Box key={index}>
            <Card 
              elevation={2} 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    color: category.color, 
                    mr: 2,
                    p: 1,
                    borderRadius: 2,
                    backgroundColor: `${category.color}15`
                  }}>
                    {category.icon}
                  </Box>
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
                    {category.title}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {category.description}
                </Typography>

                <List dense>
                  {category.resources.map((resource, resourceIndex) => (
                    <React.Fragment key={resourceIndex}>
                      <ListItem sx={{ px: 0, py: 1 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <LaunchIcon sx={{ fontSize: 20, color: category.color }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {resource.title}
                              </Typography>
                              <Chip
                                label={resource.type}
                                size="small"
                                sx={{ 
                                  backgroundColor: `${category.color}20`,
                                  color: category.color,
                                  fontWeight: 500,
                                  height: 20
                                }}
                              />
                            </Box>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              {resource.description}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {resourceIndex < category.resources.length - 1 && (
                        <Divider sx={{ mx: 2 }} />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
              
              <CardActions sx={{ p: 3, pt: 0 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{
                    borderColor: category.color,
                    color: category.color,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 'bold',
                    '&:hover': {
                      backgroundColor: `${category.color}10`,
                      borderColor: category.color
                    }
                  }}
                  onClick={() => {
                    // Open all resources in new tabs
                    category.resources.forEach(resource => {
                      window.open(resource.url, '_blank');
                    });
                  }}
                >
                  Open All Resources
                </Button>
              </CardActions>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Quick Actions */}
      <Paper elevation={2} sx={{ p: 3, mt: 4, backgroundColor: '#f8f9fa' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
          🚀 Quick Actions
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
          <Button
            variant="contained"
            fullWidth
            component={RouterLink}
            to="/quiz"
            sx={{ 
              backgroundColor: '#d32f2f',
              color: 'white',
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 'bold',
              py: 1.5,
              '&:hover': {
                backgroundColor: '#d32f2f',
                opacity: 0.9
              }
            }}
          >
            Generate Practice Quiz
          </Button>
          <Button
            variant="contained"
            fullWidth
            component={RouterLink}
            to="/tracker"
            sx={{ 
              backgroundColor: '#9c27b0',
              color: 'white',
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 'bold',
              py: 1.5,
              '&:hover': {
                backgroundColor: '#9c27b0',
                opacity: 0.9
              }
            }}
          >
            Log Today's Activities
          </Button>
          <Button
            variant="contained"
            fullWidth
            component={RouterLink}
            to="/goals"
            sx={{ 
              backgroundColor: '#2e7d32',
              color: 'white',
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 'bold',
              py: 1.5,
              '&:hover': {
                backgroundColor: '#2e7d32',
                opacity: 0.9
              }
            }}
          >
            Review Your Goals
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Resources; 