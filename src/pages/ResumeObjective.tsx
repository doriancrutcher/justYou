import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  Paper,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { useAuth } from '../components/AuthContext';
import { callClaude } from '../claudeApi';

const ResumeObjective: React.FC = () => {
  const { user } = useAuth();
  const [jobDescription, setJobDescription] = useState('');
  const [currentObjective, setCurrentObjective] = useState('');
  const [modifiedObjective, setModifiedObjective] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleGenerateObjective = async () => {
    if (!jobDescription.trim() || !currentObjective.trim()) {
      setError('Please provide both a job description and your current resume objective.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const prompt = `I need help modifying my resume objective to better match a job description. 

Current Resume Objective:
${currentObjective}

Job Description:
${jobDescription}

Please analyze the job description and modify my resume objective to:
1. Highlight relevant skills and experiences that match the job requirements
2. Use keywords from the job description
3. Make it more specific to this role
4. Keep it concise (2-3 sentences)
5. Maintain a professional tone

Please provide only the modified objective without any explanations.`;

      const response = await callClaude(prompt);
      setModifiedObjective(response);
      setSuccess('Your resume objective has been modified to better match the job description!');
    } catch (err) {
      setError('Failed to generate modified objective. Please try again.');
      console.error('Error generating objective:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(modifiedObjective);
    setSuccess('Modified objective copied to clipboard!');
  };

  const handleClear = () => {
    setJobDescription('');
    setCurrentObjective('');
    setModifiedObjective('');
    setError('');
    setSuccess('');
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h5" color="error">
          Please sign in to use the resume objective tool.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Resume Objective Optimizer
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Input a job description and your current resume objective to get an AI-optimized version that better matches the role.
      </Typography>

      <Box component="form" sx={{ mt: 3 }}>
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Job Description
          </Typography>
          <TextField
            fullWidth
            label="Paste the job description here"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            multiline
            rows={6}
            placeholder="Paste the complete job description, including requirements, responsibilities, and qualifications..."
            sx={{ mb: 2 }}
          />
        </Paper>

        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Current Resume Objective
          </Typography>
          <TextField
            fullWidth
            label="Your current resume objective"
            value={currentObjective}
            onChange={(e) => setCurrentObjective(e.target.value)}
            multiline
            rows={4}
            placeholder="Enter your current resume objective..."
            sx={{ mb: 2 }}
          />
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleGenerateObjective}
            disabled={isLoading || !jobDescription.trim() || !currentObjective.trim()}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? 'Generating...' : 'Generate Modified Objective'}
          </Button>
          
          <Button
            variant="outlined"
            onClick={handleClear}
            disabled={isLoading}
          >
            Clear All
          </Button>
        </Box>

        {modifiedObjective && (
          <Card elevation={3} sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Modified Resume Objective
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1" sx={{ 
                whiteSpace: 'pre-wrap', 
                lineHeight: 1.6,
                backgroundColor: '#f8f9fa',
                p: 2,
                borderRadius: 1,
                border: '1px solid #e9ecef'
              }}>
                {modifiedObjective}
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleCopyToClipboard}
                >
                  Copy to Clipboard
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </Container>
  );
};

export default ResumeObjective; 