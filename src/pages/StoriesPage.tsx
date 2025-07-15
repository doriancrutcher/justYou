import React, { useEffect, useState, useCallback } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  IconButton,
  Chip,
  Paper,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/AuthContext';
import { Analytics } from '../mixpanel';
import { callClaude } from '../claudeApi';

interface Story {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  date: string;
  createdAt: Date;
  youtubeLink?: string;
  imageUrl?: string;
  authorId?: string;
}

const StoriesPage: React.FC = () => {
  const { user, signInWithGoogle } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [coverLetterOpen, setCoverLetterOpen] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [generating, setGenerating] = useState(false);
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchStories = useCallback(async () => {
    if (!user) {
      setStories([]);
      return;
    }

    setLoading(true);
    try {
      const storiesQuery = query(
        collection(db, 'stories'),
        where('authorId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(storiesQuery);
      const storiesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Story[];
      setStories(storiesData);
      
      // Track successful fetch
      Analytics.trackEvent('Fetch Stories', {
        storiesCount: storiesData.length,
        userId: user.uid
      });
    } catch (error) {
      console.error('Error fetching stories:', error);
      Analytics.trackError('Fetch Stories Error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: user?.uid
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  useEffect(() => {
    if (selectAll) {
      setSelectedStoryIds(stories.map(s => s.id));
    } else {
      setSelectedStoryIds([]);
    }
  }, [selectAll, stories]);

  const handleDeleteStory = async (storyId: string) => {
    if (!user) return;
    
    try {
      await deleteDoc(doc(db, 'stories', storyId));
      setStories(stories.filter(story => story.id !== storyId));
      
      // Track story deletion
      Analytics.trackEvent('Delete Story', {
        storyId,
        userId: user.uid
      });
    } catch (error) {
      console.error('Error deleting story:', error);
      Analytics.trackError('Delete Story Error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        storyId,
        userId: user?.uid
      });
    }
  };

  // Cover letter generation functions
  const handleStoryCheckbox = (id: string) => {
    setSelectedStoryIds(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
  };

  const handleGenerateCoverLetter = async () => {
    setGenerating(true);
    setCoverLetter('');
    setEditText('');
    const selectedStories = stories.filter(s => selectedStoryIds.includes(s.id));
    const storiesText = selectedStories.map(s => `Title: ${s.title}\n${s.content}`).join('\n\n');
    const prompt = `Using the following stories as background about me, write a professional cover letter for this job: ${jobDescription}\n\nMy stories:\n${storiesText}`;
    try {
      const result = await callClaude(prompt);
      setCoverLetter(result);
      setEditText(result);
    } catch (err) {
      setCoverLetter('Error: ' + err);
      setEditText('Error: ' + err);
    }
    setGenerating(false);
  };

  const handleSaveCoverLetter = async () => {
    setSaving(true);
    try {
      await addDoc(collection(db, 'coverLetters'), {
        jobDescription,
        storyIds: selectedStoryIds,
        coverLetter: editText,
        createdAt: new Date(),
        userEmail: user?.email || '',
      });
      setCoverLetterOpen(false);
    } catch (err) {
      alert('Error saving cover letter: ' + err);
    }
    setSaving(false);
  };

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Your Stories
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Sign in to access your personal story management features.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={signInWithGoogle}
            sx={{ borderRadius: 2, textTransform: 'none', px: 4, py: 1.5 }}
          >
            Sign in to Access Stories
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Your Stories
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setCoverLetterOpen(true)}
            startIcon={<DescriptionIcon />}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Generate Cover Letter
          </Button>
          <Button
            variant="contained"
            component={RouterLink}
            to="/create"
            startIcon={<AddIcon />}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            New Story
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>Loading your stories...</Typography>
        </Box>
      ) : stories.length === 0 ? (
        <Paper elevation={2} sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No stories yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Start building your professional narrative by creating your first story.
          </Typography>
          <Button
            variant="contained"
            component={RouterLink}
            to="/create"
            startIcon={<AddIcon />}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Create Your First Story
          </Button>
        </Paper>
      ) : (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 3 
        }}>
          {stories.map((story) => (
            <Box key={story.id} sx={{ display: 'flex' }}>
              <Card elevation={2} sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                {story.imageUrl && (
                  <Box sx={{ height: 200, overflow: 'hidden' }}>
                    <img 
                      src={story.imageUrl} 
                      alt={story.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {story.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {story.excerpt}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip 
                      label={story.date} 
                      size="small" 
                      variant="outlined"
                      clickable={false}
                    />
                    {story.youtubeLink && (
                      <Chip 
                        label="Video" 
                        size="small" 
                        color="secondary"
                        clickable={false}
                      />
                    )}
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      component={RouterLink}
                      to={`/post/${story.id}`}
                      size="small"
                      color="primary"
                      title="View Story"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      component={RouterLink}
                      to={`/edit/${story.id}`}
                      size="small"
                      color="primary"
                      title="Edit Story"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteStory(story.id)}
                      size="small"
                      color="error"
                      title="Delete Story"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {/* Floating Action Button for quick story creation */}
      <Fab
        color="primary"
        component={RouterLink}
        to="/create"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        title="Create New Story"
      >
        <AddIcon />
      </Fab>

      {/* Cover Letter Generator Modal */}
      <Dialog open={coverLetterOpen} onClose={() => setCoverLetterOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Generate Cover Letter with AI</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Paste the job description below:</Typography>
          <TextField
            fullWidth
            multiline
            minRows={4}
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value)}
            placeholder="Paste job description here..."
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={<Checkbox checked={selectAll} onChange={e => setSelectAll(e.target.checked)} />}
            label="Select All My Stories"
          />
          <List>
            {stories.map(story => (
              <ListItem key={story.id}>
                <Checkbox
                  checked={selectedStoryIds.includes(story.id)}
                  onChange={() => handleStoryCheckbox(story.id)}
                />
                <ListItemText primary={story.title} secondary={story.date} />
              </ListItem>
            ))}
          </List>
          {coverLetter && (
            <Box sx={{ mt: 2, p: 2, background: '#f5f5f5', borderRadius: 2 }}>
              <Typography variant="subtitle1">Generated Cover Letter (edit before saving):</Typography>
              <TextField
                fullWidth
                multiline
                minRows={8}
                value={editText}
                onChange={e => setEditText(e.target.value)}
                sx={{ mb: 1 }}
              />
              <Button sx={{ mr: 1 }} onClick={() => navigator.clipboard.writeText(editText)}>Copy to Clipboard</Button>
              <Button variant="contained" color="success" onClick={handleSaveCoverLetter} disabled={saving}>
                {saving ? 'Saving...' : 'Save Cover Letter'}
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCoverLetterOpen(false)}>Close</Button>
          <Button
            onClick={handleGenerateCoverLetter}
            variant="contained"
            disabled={generating || !jobDescription || selectedStoryIds.length === 0}
          >
            {generating ? 'Generating...' : 'Generate Cover Letter'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StoriesPage; 