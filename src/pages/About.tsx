import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const About: React.FC = () => (
  <Container maxWidth="md" sx={{ mt: 6 }}>
    <Box sx={{ p: 4, background: '#f5f5f5', borderRadius: 2 }}>
      <Typography variant="h4" gutterBottom>About MyNarrative</Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        <b>MyNarrative</b> is your personal vault for life stories and experiences. Here, you can create a collection of personalized stories—moments, memories, and reflections that matter to you.
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        The real value? You can use your story collection as a creative toolkit: generate cover letters, bios, or anything else you need, all based on your authentic experiences. No more scrambling to remember details or rewriting your story from scratch—your life's highlights are always at your fingertips.
      </Typography>
      <Typography variant="body1">
        Start writing, start collecting, and let your stories work for you!
      </Typography>
    </Box>
  </Container>
);

export default About; 