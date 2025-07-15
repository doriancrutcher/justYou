import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Paper, Box } from '@mui/material';
import { doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { callClaude } from '../claudeApi';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { useAuth } from '../components/AuthContext';
import { List, ListItem, ListItemText, TextField, Button } from '@mui/material';

interface Story {
  id: string;
  title: string;
  content: string;
  date: string;
  youtubeLink?: string;
  imageUrl?: string;
  authorId?: string;
}

const ViewPost: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, signInWithGoogle } = useAuth();
  const [coverLetterOpen, setCoverLetterOpen] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [allStories, setAllStories] = useState<any[]>([]);
  const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [generating, setGenerating] = useState(false);
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchStory = async () => {
      if (!id) return;
      
      try {
        const docRef = doc(db, 'stories', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setStory({ id: docSnap.id, ...docSnap.data() } as Story);
        } else {
          console.log('No such story exists!');
        }
      } catch (error) {
        console.error('Error fetching story:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [id]);

  useEffect(() => {
    // Fetch only user's stories for selection
    const fetchUserStories = async () => {
      if (!user) {
        setAllStories([]);
        return;
      }
      
      try {
        const storiesQuery = query(
          collection(db, 'stories'),
          where('authorId', '==', user.uid)
        );
        const querySnapshot = await getDocs(storiesQuery);
        setAllStories(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Error fetching user stories:', error);
        setAllStories([]);
      }
    };
    fetchUserStories();
  }, [user]);

  useEffect(() => {
    if (selectAll) {
      setSelectedStoryIds(allStories.filter(s => user && user.uid === s.authorId).map(s => s.id));
    } else {
      setSelectedStoryIds([]);
    }
    // eslint-disable-next-line
  }, [selectAll, allStories]);

  const handleStoryCheckbox = (id: string) => {
    setSelectedStoryIds(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
  };

  const handleGenerateCoverLetter = async () => {
    setGenerating(true);
    setCoverLetter('');
    setEditText('');
    const selectedStories = allStories.filter(s => selectedStoryIds.includes(s.id));
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

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (!story) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography>Story not found</Typography>
      </Container>
    );
  }

  // Check if user is authorized to view this story
  if (!user || (story.authorId && story.authorId !== user.uid)) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            You don't have permission to view this story.
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
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {story.title}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {story.date}
        </Typography>
        <Box sx={{ mt: 3 }}>
          <Typography variant="body1" paragraph>
            {story.content}
          </Typography>
          {story.imageUrl && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <img src={story.imageUrl} alt="Blog" style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 8 }} />
            </Box>
          )}
          {story.youtubeLink && story.youtubeLink.includes('youtube') && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <iframe
                width="560"
                height="315"
                src={`https://www.youtube.com/embed/${extractYouTubeId(story.youtubeLink)}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </Box>
          )}
        </Box>
        {user && user.uid === story.authorId && (
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button variant="outlined" color="primary">Edit</Button>
            <Button variant="outlined" color="error">Delete</Button>
          </Box>
        )}
      </Paper>
      {/* Secondary Tools Section */}
      <Box sx={{ mt: 4, mb: 4, p: 2, background: '#e3f2fd', borderRadius: 2 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Secondary Tools</Typography>
        {user && user.email === 'crutcherdorian@gmail.com' && (
          <Button variant="contained" color="primary" onClick={() => setCoverLetterOpen(true)}>
            Generate Cover Letter
          </Button>
        )}
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
              {allStories.filter(s => user && user.uid === s.authorId).map(story => (
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
      </Box>
    </Container>
  );
};

// Helper function to extract YouTube video ID
function extractYouTubeId(url: string): string | undefined {
  const regExp = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[1].length === 11 ? match[1] : undefined;
}

export default ViewPost; 