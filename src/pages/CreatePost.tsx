import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../components/AuthContext';
import prompts from '../prompts';

const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [youtubeLink, setYoutubeLink] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<string>(prompts[Math.floor(Math.random() * prompts.length)]);

  const wordCount = content.trim() === '' ? 0 : content.trim().split(/\s+/).length;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setImagePreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    let imageUrl = '';

    try {
      if (imageFile) {
        const storage = getStorage();
        const imageRef = ref(storage, `blog-images/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      const docRef = await addDoc(collection(db, 'stories'), {
        title,
        content,
        excerpt: content.substring(0, 150) + '...',
        date: new Date().toLocaleDateString(),
        createdAt: new Date(),
        youtubeLink,
        imageUrl,
        authorId: user?.uid || '',
        authorEmail: user?.email || '',
      });
      
      console.log('Story written with ID:', docRef.id);
      navigate('/');
    } catch (error) {
      console.error('Error adding story:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewPrompt = () => {
    let newPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    // Avoid repeating the same prompt
    while (newPrompt === currentPrompt && prompts.length > 1) {
      newPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    }
    setCurrentPrompt(newPrompt);
  };

  const handleUsePrompt = () => {
    setContent(content ? content + '\n' + currentPrompt : currentPrompt);
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h5" color="error">You are not authorized to create stories.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Write Your Story
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <TextField
          fullWidth
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          margin="normal"
          required
          disabled={isSubmitting}
          placeholder={currentPrompt}
        />
        <TextField
          fullWidth
          label="Your Story"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          margin="normal"
          required
          multiline
          rows={10}
          disabled={isSubmitting}
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Word count: {wordCount}
        </Typography>
        <TextField
          fullWidth
          label="YouTube Link (optional)"
          value={youtubeLink}
          onChange={(e) => setYoutubeLink(e.target.value)}
          margin="normal"
          disabled={isSubmitting}
        />
        <Box sx={{ my: 2 }}>
          <Button
            variant="outlined"
            component="label"
            disabled={isSubmitting}
          >
            Upload Image
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleImageChange}
            />
          </Button>
          {imagePreview && (
            <Box sx={{ mt: 2 }}>
              <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200 }} />
            </Box>
          )}
        </Box>
        <Box sx={{ mb: 3, p: 2, background: '#f5f5f5', borderRadius: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Need inspiration?</Typography>
          <Typography variant="body2" sx={{ fontStyle: 'italic', mb: 1 }}>{currentPrompt}</Typography>
          <Button size="small" variant="outlined" onClick={handleNewPrompt}>Show another prompt</Button>
        </Box>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          sx={{ mt: 3 }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Publishing...' : 'Publish Story'}
        </Button>
      </Box>
    </Container>
  );
};

export default CreatePost; 