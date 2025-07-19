import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingScreen: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'background.default'
      }}
    >
      <CircularProgress size={60} sx={{ mb: 3 }} />
      <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
        Loading JobGoalz...
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Verifying your session
      </Typography>
    </Box>
  );
};

export default LoadingScreen; 