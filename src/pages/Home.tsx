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
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Link,
  IconButton} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Book as BookIcon,
  Flag as FlagIcon,
  Description as DescriptionIcon,
  Timeline as TimelineIcon,
  Quiz as QuizIcon,
  School as SchoolIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayArrowIcon,
  Link as LinkIcon,
  CheckCircle as CheckCircleIcon,
  Psychology as PsychologyIcon,
  AutoStories as AutoStoriesIcon
} from '@mui/icons-material';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import { useAuth } from '../components/AuthContext';

const Home: React.FC = () => {
  const { user, signInWithGoogle } = useAuth();

  const valuePropositions = [
    {
      icon: <CheckCircleIcon sx={{ fontSize: 48, color: '#2e7d32' }} />,
      title: "Track and Achieve Career Goals",
      description: "Stay focused with personalized goals, progress tracking, and a clear, actionable dashboard.",
      features: ["Smart goal setting", "Progress visualization", "Milestone tracking", "Actionable insights"]
    },
    {
      icon: <PsychologyIcon sx={{ fontSize: 48, color: '#1976d2' }} />,
      title: "Train Smarter with AI-Powered Quizzes",
      description: "Turn your notes into quizzes to sharpen your skills and prep for interviews with confidence.",
      features: ["AI-generated questions", "Custom difficulty levels", "Instant feedback"]
    },
    {
      icon: <AutoStoriesIcon sx={{ fontSize: 48, color: '#ed6c02' }} />,
      title: "Build Your Story, Boost Your Impact",
      description: "Manage applications, draft resumes, log your job search, and transform stories into targeted cover letters — all in one place.",
      features: ["Story management", "Resume building", "Application tracking", "Cover letter generation"]
    }
  ];

  const dailyRules = [
    {
      title: "No Phone while Studying",
      description: "The mere presence of a phone has been shown to impair cognitive performance (Adrian Ward et al., University of Texas at Austin, 2017). Even when not actively used, phones create a cognitive load that reduces your ability to focus and think critically.",
      video: "https://www.youtube.com/watch?v=G-cdVurdoeA",
      videoTitle: "Adam Conover on AI and Phones Eroding Critical Thinking",
      resources: ["Research: The Brain Drain of Smartphone Presence"]
    },
    {
      title: "Phone is to be thought of as an evil device",
      description: "Smartphones and social media platforms are intentionally engineered to be addictive, using tactics like infinite scroll, variable rewards, and personalized notifications to hijack attention. This isn't just about engagement — it's about creating more predictable, influenceable consumers. The result? A more distracted population that's easier to market to and less likely to critically reflect.",
      link: "https://www.humanetech.com/who-we-are#problem",
      linkTitle: "Center for Humane Technology – The Problem",
      resources: ["The Social Dilemma Documentary", "Your Undivided Attention Podcast"]
    },
    {
      title: "We will fill out a form of what we did today",
      description: "Sometimes it's hard to see how much or how little we did unless it's recorded and presented to ourselves. The tracking tool is meant to help you see where you've succeeded, where you need to improve, and show you what is, and isn't working.",
      resources: ["Daily Activity Tracking", "Progress Visualization", "Habit Formation Science"]
    },
    {
      title: "AI will only be used for definitions, explanations and practice questions",
      description: "AI is a powerful tool and we need to learn how to use it. But when studying or learning we shouldn't have it feed us answers but let it give us more tools to work out our brains. If you know the subject matter, then great use AI. If you are learning the subject matter, as Adam mentions you need to struggle to get better. Because simply put... that's just how our brains work.",
      video: "https://www.youtube.com/watch?v=G-cdVurdoeA",
      videoTitle: "Adam Conover on AI and Learning",
      book: {
        title: "Make It Stick: The Science of Successful Learning",
        authors: "Peter C. Brown, Henry L. Roediger III, and Mark A. McDaniel",
        description: "Explains the science behind learning through difficulty, busts myths like 'repetition = mastery', and introduces the idea of 'desirable difficulties' — struggles that help learning stick."
      },
      resources: ["Desirable Difficulties", "Practice vs Repetition", "Learning Science"]
    },
    {
      title: "Studying is to be thought of as fun and not just to get a job",
      description: "If you enjoy what you're learning then it becomes easier to commit the time to study. If you are just doing it to get a job, you might not enjoy that job. Not everything you study will be enjoyable, but doesn't mean you have to dislike the journey to get to the goal. Do your best to know that you are enriching your mind, and building a better future for yourself and those you love. And if you truly hate what you are learning, then try something else.",
      resources: ["Intrinsic Motivation", "Growth Mindset", "Career Alignment"]
    },
    {
      title: "When you get a headache or feel tired from studying this is to be thought of as working out a muscle at the gym until it's sore knowing it'll make you stronger",
      description: "Mental fatigue is a sign that you're pushing your cognitive boundaries. Just like physical exercise, the discomfort you feel during intense study sessions is your brain adapting and growing stronger. This 'desirable difficulty' is essential for deep learning and skill development.",
      resources: ["Cognitive Load Theory", "Mental Fatigue Research", "Brain Plasticity"]
    },
    {
      title: "No worrying about other people's opinions as it relates to your goal, only seek constructive feedback",
      description: "Focus on your own journey and progress rather than comparing yourself to others. Constructive feedback helps you grow, but unsolicited opinions can derail your focus and confidence. Trust your process and stay committed to your personal development path.",
      resources: ["Self-Determination Theory", "Constructive Feedback", "Goal Setting"]
    },
    {
      title: "When feeling intense emotions from the world around us, acknowledge them and turn those feelings into action",
      description: "We live in one of the most stressful times in history, from the turmoil in the political climate, to the rise and uncertainty of AI , and with that our emotions can run high. Emotions don’t make you weak. Acknowledge them — write down what you’re feeling, why, and what might help. Then, choose what to do with that emotion. Use it to build, not break. Rest when you need to, but remember: only action changes your situation. Always bring your emotions back to action",
      resources: ["Emotional Intelligence", "Stress Management", "Productive Coping"]
    }
  ];

  const features = [
    {
      title: "Story Management",
      description: "Write and manage your career stories and experiences",
      icon: <BookIcon sx={{ fontSize: 40 }} />,
      path: "/create",
      color: "#1976d2",
      features: ["Create new stories", "Edit existing stories", "View all stories", "Generate cover letters"]
    },
    {
      title: "Goal Setting",
      description: "Set and track your career goals and milestones",
      icon: <FlagIcon sx={{ fontSize: 40 }} />,
      path: "/goals",
      color: "#2e7d32",
      features: ["Set SMART goals", "Track progress", "Visualize achievements"]
    },
    {
      title: "Resume Builder",
      description: "Optimize your resume objective with AI assistance",
      icon: <DescriptionIcon sx={{ fontSize: 40 }} />,
      path: "/resume",
      color: "#ed6c02",
      features: ["AI-powered optimization", "Professional templates", "Industry-specific guidance"]
    },
    {
      title: "Job Search Tracker",
      description: "Track your daily job search and upskilling activities",
      icon: <TimelineIcon sx={{ fontSize: 40 }} />,
      path: "/tracker",
      color: "#9c27b0",
      features: ["Log daily activities", "Track time spent", "Monitor progress", "Generate reports"]
    },
    {
      title: "AI Quiz Generator",
      description: "Generate practice quizzes from your study materials",
      icon: <QuizIcon sx={{ fontSize: 40 }} />,
      path: "/quiz",
      color: "#d32f2f",
      features: ["AI-generated questions", "Custom difficulty levels", "Instant grading", "Study reinforcement"]
    },
    {
      title: "Learning Resources",
      description: "Access educational materials and career guidance",
      icon: <SchoolIcon sx={{ fontSize: 40 }} />,
      path: "/resources",
      color: "#1565c0",
      features: ["Study materials", "Career guides", "Industry insights", "Best practices"]
    }
  ];

  if (!user) {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* Hero Section */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ 
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 4
          }}>
            Welcome to JobGoalz
          </Typography>
          
          <Typography variant="h6" color="text.secondary" sx={{ 
            mb: 6, 
            maxWidth: 600, 
            mx: 'auto',
            lineHeight: 1.6,
            fontSize: '1.1rem'
          }}>
            I made this to consolidate all of what I learned about the job search in the age of AI into one location
          </Typography>

          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: 1,
            mb: 6
          }}>
            <Typography variant="body1" color="text.secondary" sx={{ 
              fontSize: '0.9rem',
              opacity: 0.7
            }}>
              Created by
            </Typography>
            <Link
              href="https://www.linkedin.com/in/dorian-crutcher/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ 
                textDecoration: 'none',
                transition: 'all 0.2s ease-in-out',
                '@keyframes wiggle': {
                  '0%, 100%': {
                    transform: 'rotate(-2deg)'
                  },
                  '25%': {
                    transform: 'rotate(-1deg)'
                  },
                  '50%': {
                    transform: 'rotate(-3deg)'
                  },
                  '75%': {
                    transform: 'rotate(-1deg)'
                  }
                },
                animation: 'wiggle 3s ease-in-out infinite',
                animationDelay: '2s',
                '&:hover': {
                  opacity: 0.8,
                  animation: 'none',
                  transform: 'scale(1.02) rotate(-2deg)'
                }
              }}
            >
              <Typography variant="h5" sx={{ 
                fontFamily: '"Dancing Script", cursive',
                fontWeight: 'bold',
                color: '#1976d2',
                textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                letterSpacing: '0.5px',
                cursor: 'pointer'
              }}>
                Dorian Crutcher
              </Typography>
            </Link>
          </Box>
          
          
          {/* Value Propositions */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 4, 
            mb: 6 
          }}>
            {valuePropositions.map((proposition, index) => (
              <Card key={index} sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                p: 3,
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.15)'
                }
              }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  {proposition.icon}
                </Box>
                <Typography variant="h6" component="h3" gutterBottom sx={{ 
                  fontWeight: 'bold',
                  textAlign: 'center',
                  mb: 2
                }}>
                  {proposition.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ 
                  textAlign: 'center',
                  mb: 3,
                  flexGrow: 1
                }}>
                  {proposition.description}
              </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {proposition.features.map((feature, featureIndex) => (
                    <Box key={featureIndex} sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      fontSize: '0.875rem',
                      color: 'text.secondary'
                    }}>
                      <Box sx={{ 
                        width: 6, 
                        height: 6, 
                        borderRadius: '50%', 
                        backgroundColor: 'primary.main',
                        flexShrink: 0
                      }} />
                      {feature}
                    </Box>
                  ))}
                </Box>
              </Card>
            ))}
          </Box>

          {/* CTA Section */}
          <Box sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 4,
            p: 4,
            mb: 4,
            color: 'white'
          }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Ready to Transform Your Career?
              </Typography>
            <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
              Join thousands of professionals who are already using JobGoalz to accelerate their career development
              </Typography>
                  <Button
              variant="contained"
              size="large"
              onClick={signInWithGoogle}
              sx={{ 
                borderRadius: 3, 
                textTransform: 'none', 
                px: 4, 
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                backgroundColor: 'white',
                color: '#667eea',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                },
                transition: 'all 0.3s ease-in-out'
              }}
            >
              Sign in with Google to Get Started
                  </Button>
          </Box>


        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Daily Rules Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
          📋 Daily Rules to Live By
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {dailyRules.map((rule, index) => (
            <Accordion key={index} sx={{ 
              backgroundColor: 'transparent',
              boxShadow: 'none',
              '&:before': { display: 'none' },
              '&.Mui-expanded': { margin: 0 }, 
              padding: 1
            }} >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ 
                  px: 0,
                  '& .MuiAccordionSummary-content': { margin: 0 }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    backgroundColor: '#1976d2',
                    flexShrink: 0
                  }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {rule.title}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pt: 0 }}>
                <Box sx={{ pl: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {rule.description}
                  </Typography>
                  
                  {/* Video Link */}
                  {rule.video && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <IconButton
                      size="small"
                        onClick={() => window.open(rule.video, '_blank')}
                        sx={{ color: '#1976d2' }}
                      >
                        <PlayArrowIcon />
                      </IconButton>
                      <Link
                        href={rule.video}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: '#1976d2', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                      >
                        {rule.videoTitle}
                      </Link>
                  </Box>
                )}

                  {/* External Link */}
                  {rule.link && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <IconButton
                      size="small"
                        onClick={() => window.open(rule.link, '_blank')}
                        sx={{ color: '#1976d2' }}
                      >
                        <LinkIcon />
                      </IconButton>
                      <Link
                        href={rule.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: '#1976d2', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                      >
                        {rule.linkTitle}
                      </Link>
                  </Box>
                )}

                  {/* Book Recommendation */}
                  {rule.book && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2, p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
                      <BookIcon sx={{ color: '#1976d2', fontSize: 20, mt: 0.5 }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
                          📚 {rule.book.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          by {rule.book.authors}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {rule.book.description}
                        </Typography>
                      </Box>
              </Box>
                  )}

                  {/* Resources */}
                  {rule.resources && rule.resources.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {rule.resources.map((resource, resourceIndex) => (
                        <Chip
                          key={resourceIndex}
                          label={resource}
                          clickable={false}
                          size="small"
                          sx={{ 
                            backgroundColor: 'primary.light',
                            color: 'primary.main',
                            fontWeight: 500,
                            fontSize: '0.75rem'
                          }}
                        />
        ))}
      </Box>
                  )}
            </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Paper>

      {/* Welcome Section */}
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 1 }}>
        Welcome back, {user.displayName?.split(' ')[0] || 'User'}! 👋
      </Typography>
      <Typography variant="h6" color="text.secondary" align="center" sx={{ mb: 4 }}>
        Choose a feature to continue your career journey
      </Typography>

      {/* Features Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
        {features.map((feature, index) => (
          <Box key={index}>
            <Card 
              elevation={2} 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    color: feature.color, 
                    mr: 2,
                    p: 1,
                    borderRadius: 2,
                    backgroundColor: `${feature.color}15`
                  }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
                    {feature.title}
                  </Typography>
      </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {feature.description}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  {feature.features.map((feat, featIndex) => (
                    <Chip
                      key={featIndex}
                      label={feat}
                      size="small"
                      sx={{ 
                        mr: 0.5, 
                        mb: 0.5,
                        backgroundColor: `${feature.color}20`,
                        color: feature.color,
                        fontWeight: 500
                      }}
                    />
                  ))}
            </Box>
              </CardContent>
              
              <CardActions sx={{ p: 3, pt: 0 }}>
          <Button
                  component={RouterLink}
                  to={feature.path}
            variant="contained"
                  fullWidth
                  sx={{
                    backgroundColor: feature.color,
                    color: 'white',
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 'bold',
                    '&:hover': {
                      backgroundColor: feature.color,
                      opacity: 0.9
                    }
                  }}
                >
                  Get Started
          </Button>
              </CardActions>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Contact Section */}
      <Box sx={{ mt: 8, pt: 4, borderTop: '1px solid #e0e0e0' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Have suggestions or want to connect? Find me on LinkedIn!
          </Typography>
          <Link
            href="https://www.linkedin.com/in/dorian-crutcher/"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ 
              color: '#1976d2', 
              textDecoration: 'none', 
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              p: 1,
              borderRadius: 1,
              transition: 'all 0.2s ease',
              '&:hover': { 
                backgroundColor: 'action.hover',
                transform: 'scale(1.05)'
              }
            }}
          >
            <LinkedInIcon sx={{ fontSize: 32, color: '#0077b5' }} />
          </Link>
        </Box>
      </Box>

    </Container>
  );
};

export default Home; 