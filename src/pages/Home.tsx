import React, { useState, useEffect } from 'react';
import { Container, Typography, Card, CardContent, CardActions, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc, query, where, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/AuthContext';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { callClaude } from '../claudeApi';
import { List, ListItem, ListItemText } from '@mui/material';
import { TextField } from '@mui/material';

interface Story {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  authorId?: string;
  authorName?: string;
}

const Home: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, signInWithGoogle } = useAuth();
  const [coverLetterOpen, setCoverLetterOpen] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [generating, setGenerating] = useState(false);
  const [coverLetters, setCoverLetters] = useState<any[]>([]);
  const [savingCoverLetter, setSavingCoverLetter] = useState(false);
  const [coverLetterTitle, setCoverLetterTitle] = useState('');

  const fetchStories = async () => {
    setLoading(true);
    try {
      if (!user) return;
      const q = query(collection(db, 'stories'), where('authorId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const storiesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Story[];
      setStories(storiesData);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoverLetters = async () => {
    if (!user) return;
    const q = query(collection(db, 'coverLetters'), where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    setCoverLetters(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchStories();
    fetchCoverLetters();
  }, [user]);

  useEffect(() => {
    if (selectAll) {
      setSelectedStoryIds(stories.filter(s => user && user.uid === s.authorId).map(s => s.id));
    } else {
      setSelectedStoryIds([]);
    }
    // eslint-disable-next-line
  }, [selectAll]);

  const handleStoryCheckbox = (id: string) => {
    setSelectedStoryIds(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
  };

  const handleGenerateCoverLetter = async () => {
    setGenerating(true);
    setCoverLetter('');
    const selectedStories = stories.filter(s => selectedStoryIds.includes(s.id));
    const storiesText = selectedStories.map(s => `Title: ${s.title}\n${s.content}`).join('\n\n');
    const prompt = `Using the following stories as background about me, write a professional cover letter for this job: ${jobDescription}\n\nMy stories:\n${storiesText}`;
    try {
      const result = await callClaude(prompt);
      setCoverLetter(result);
    } catch (err) {
      setCoverLetter('Error: ' + err);
    }
    setGenerating(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this story?')) return;
    try {
      await deleteDoc(doc(db, 'stories', id));
      setStories((prev) => prev.filter((story) => story.id !== id));
    } catch (error) {
      console.error('Error deleting story:', error);
    }
  };

  const handleSaveCoverLetter = async () => {
    if (!user || !coverLetterTitle.trim() || !coverLetter.trim()) return;
    setSavingCoverLetter(true);
    try {
      await addDoc(collection(db, 'coverLetters'), {
        userId: user.uid,
        userEmail: user.email,
        title: coverLetterTitle,
        content: coverLetter,
        jobDescription,
        storyIds: selectedStoryIds,
        createdAt: new Date(),
      });
      setCoverLetterTitle('');
      setCoverLetter('');
      setJobDescription('');
      setSelectedStoryIds([]);
      setCoverLetterOpen(false);
      fetchCoverLetters();
    } catch (err) {
      alert('Error saving cover letter: ' + err);
    }
    setSavingCoverLetter(false);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Latest Stories
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {stories.length === 0 && !loading && !user && (
          <Typography variant="h6" color="text.secondary" sx={{ mt: 4 }}>
            <span
              style={{ color: '#1976d2', textDecoration: 'underline', cursor: 'pointer' }}
              onClick={signInWithGoogle}
            >
              Sign in
            </span> and start writing your story!
          </Typography>
        )}
        {stories.length === 0 && !loading && user && (
          <Typography variant="h6" color="text.secondary" sx={{ mt: 4 }}>
            You have no stories yet. Your life is a blank page—start writing before someone else does!
          </Typography>
        )}
        {stories.map((story) => (
          <Card key={story.id}>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                {story.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {story.date}
              </Typography>
              <Typography variant="body1">
                {story.excerpt}
              </Typography>
            </CardContent>
            <CardActions>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ background: '#1976d2', borderRadius: 1, px: 2, py: 0.5 }}>
                  <Button
                    size="small"
                    component={RouterLink}
                    to={`/post/${story.id}`}
                    sx={{ color: '#fff', fontWeight: 'bold' }}
                  >
                    Read More
                  </Button>
                </Box>
                {user && user.uid === story.authorId && (
                  <Box sx={{ background: '#ffa000', borderRadius: 1, px: 2, py: 0.5 }}>
                    <Button
                      size="small"
                      component={RouterLink}
                      to={`/edit/${story.id}`}
                      sx={{ color: '#fff', fontWeight: 'bold' }}
                    >
                      Edit
                    </Button>
                  </Box>
                )}
                {user && user.uid === story.authorId && (
                  <Box sx={{ background: '#d32f2f', borderRadius: 1, px: 2, py: 0.5 }}>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDelete(story.id)}
                      sx={{ color: '#fff', fontWeight: 'bold' }}
                    >
                      Delete
                    </Button>
                  </Box>
                )}
              </Box>
            </CardActions>
          </Card>
        ))}
      </Box>
      {/* Cover Letters Section */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>Cover Letters</Typography>
        {user && (
          <Button variant="contained" color="primary" sx={{ mb: 2 }} onClick={() => setCoverLetterOpen(true)}>
            Generate Cover Letter with AI
          </Button>
        )}
        {coverLetters.length === 0 && user && (
          <Typography color="text.secondary">No cover letters yet. Generate one above!</Typography>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {coverLetters.map(cl => (
            <Box key={cl.id} sx={{ p: 2, border: '1px solid #eee', borderRadius: 2, background: '#fafafa' }}>
              <Typography variant="h6">{cl.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{cl.createdAt?.toDate?.().toLocaleString?.() || ''}</Typography>
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>{cl.content}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
      {/* Cover Letter Dialog */}
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
            {stories.filter(s => user && user.uid === s.authorId).map(story => (
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
              <Typography variant="subtitle1">Generated Cover Letter:</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{coverLetter}</Typography>
              <TextField
                fullWidth
                label="Title for this Cover Letter"
                value={coverLetterTitle}
                onChange={e => setCoverLetterTitle(e.target.value)}
                sx={{ mt: 2 }}
              />
              <Button sx={{ mt: 1 }} onClick={() => navigator.clipboard.writeText(coverLetter)}>Copy to Clipboard</Button>
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
          <Button
            onClick={handleSaveCoverLetter}
            variant="contained"
            color="success"
            disabled={savingCoverLetter || !coverLetterTitle || !coverLetter}
          >
            Save Cover Letter
          </Button>
        </DialogActions>
      </Dialog>
      {loading && <Typography sx={{ mt: 2 }}>Loading...</Typography>}
    </Container>
  );
};

export default Home; 