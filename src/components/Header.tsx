import React from 'react';
import { AppBar, Toolbar, Typography, Button, Container, Box, Avatar, IconButton, Menu, MenuItem } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from './AuthContext';

const Header: React.FC = () => {
  const { user, signInWithGoogle, signOutUser } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Container maxWidth="lg">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Left: Logo/Title */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography
              variant="h6"
              component={RouterLink}
              to="/"
              sx={{
                textDecoration: 'none',
                color: 'inherit',
                fontWeight: 'bold',
                mr: 4,
                letterSpacing: 1.5,
              }}
            >
              MyNarrative
            </Typography>
          </Box>

          {/* Center: Navigation Links */}
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button color="inherit" component={RouterLink} to="/">
              Stories
            </Button>
            <Button color="inherit" component={RouterLink} to="/goals">
              Goals
            </Button>
            <Button color="inherit" component={RouterLink} to="/resume">
              Resume
            </Button>
            <Button color="inherit" component={RouterLink} to="/tracker">
              Tracker
            </Button>
            <Button color="inherit" component={RouterLink} to="/quiz">
              Quiz
            </Button>
            <Button color="inherit" component={RouterLink} to="/about">
              About
            </Button>
          </Box>

          {/* Right: Auth Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {user ? (
              <>
                <IconButton onClick={handleMenu} size="small" sx={{ ml: 1 }}>
                  <Avatar alt={user.displayName || undefined} src={user.photoURL || undefined} />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  onClick={handleClose}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <MenuItem disabled>{user.displayName}</MenuItem>
                  <MenuItem onClick={signOutUser}>Sign Out</MenuItem>
                </Menu>
                {user && (
                  <Button color="primary" variant="contained" sx={{ borderRadius: 2, textTransform: 'none' }} component={RouterLink} to="/create">
                    New Story
                  </Button>
                )}
              </>
            ) : (
              <Button color="primary" variant="contained" sx={{ borderRadius: 2, textTransform: 'none' }} onClick={signInWithGoogle}>
                Sign in with Google
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header; 