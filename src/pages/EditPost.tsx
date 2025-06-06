import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Typography, TextField, Button, Box } from '@mui/material';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../components/AuthContext';

const EditPost: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStory = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const docRef = doc(db, 'stories', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (user?.uid !== data.authorId) {
            setError('You are not authorized to edit this story.');
            setLoading(false);
            return;
          }
          setTitle(data.title || '');
          setContent(data.content || '');
          setYoutubeLink(data.youtubeLink || '');
          setImageUrl(data.imageUrl || '');
        } else {
          setError('Story not found.');
        }
      } catch (err) {
        setError('Error loading story.');
      } finally {
        setLoading(false);
      }
    };
    fetchStory();
  }, [id, user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setImagePreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let newImageUrl = imageUrl;
    try {
      if (imageFile) {
        const storage = getStorage();
        const imageRef = ref(storage, `blog-images/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        newImageUrl = await getDownloadURL(imageRef);
      }
      await updateDoc(doc(db, 'stories', id!), {
        title,
        content,
        youtubeLink,
        imageUrl: newImageUrl,
        excerpt: content.substring(0, 150) + '...'
      });
      navigate('/');
    } catch (err) {
      setError('Error updating story.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography color="error">You are not authorized to edit stories.</Typography>
      </Container>
    );
  }

  if (loading) return <Container sx={{ mt: 4 }}><Typography>Loading...</Typography></Container>;
  if (error) return <Container sx={{ mt: 4 }}><Typography color="error">{error}</Typography></Container>;

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Edit Story
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <TextField
          fullWidth
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          margin="normal"
          required
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
        />
        <TextField
          fullWidth
          label="YouTube Link (optional)"
          value={youtubeLink}
          onChange={(e) => setYoutubeLink(e.target.value)}
          margin="normal"
        />
        <Box sx={{ my: 2 }}>
          <Button
            variant="outlined"
            component="label"
          >
            Upload New Image
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleImageChange}
            />
          </Button>
          {(imagePreview || imageUrl) && (
            <Box sx={{ mt: 2 }}>
              <img src={imagePreview || imageUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200 }} />
            </Box>
          )}
        </Box>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          sx={{ mt: 3 }}
        >
          Save Changes
        </Button>
      </Box>
    </Container>
  );
};

export default EditPost; 