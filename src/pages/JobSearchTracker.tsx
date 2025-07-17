import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  Paper,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { useAuth } from '../components/AuthContext';
import { collection, addDoc, query, where, orderBy, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Analytics } from '../mixpanel';

interface Activity {
  id: string;
  type: 'job_search' | 'upskilling';
  title: string;
  description: string;
  date: string;
  timeSpent: number; // in minutes
  status: 'completed' | 'in_progress' | 'planned';
  createdAt: Date;
}

const JobSearchTracker: React.FC = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newActivity, setNewActivity] = useState({
    type: 'job_search' as 'job_search' | 'upskilling',
    title: '',
    description: '',
    timeSpent: 0,
    status: 'completed' as 'completed' | 'in_progress' | 'planned'
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [timeMode, setTimeMode] = useState<'minutes' | 'range'>('minutes');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Track page load
  useEffect(() => {
    Analytics.trackFeatureUsage('Job Search Tracker', {
      activitiesCount: activities.length,
      timeInputMode: timeMode
    });
  }, [activities.length, timeMode]);

  const loadActivities = useCallback(async () => {
    if (!user) return;
    
    try {
      const q = query(
        collection(db, 'activities'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const activitiesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Activity[];
      setActivities(activitiesData);
      
      // Track successful fetch
      Analytics.trackJobSearchEvent('Fetch Activities', {
        activitiesCount: activitiesData.length
      });
    } catch (err) {
      console.error('Error loading activities:', err);
      setError('Failed to load activities');
      Analytics.trackError('Fetch Job Search Activities Error', {
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }, [user]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (user) {
      loadActivities();
    }
  }, [user, loadActivities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!newActivity.title.trim()) {
      setError('Please enter a title for your activity');
      Analytics.trackJobSearchEvent('Add Activity Attempt', {
        error: 'Missing required fields',
        hasActivity: !!newActivity.title.trim()
      });
      return;
    }

    let timeSpent = 0;
    if (timeMode === 'minutes') {
      timeSpent = parseInt(newActivity.timeSpent === 0 ? '' : newActivity.timeSpent.toString()) || 0;
    } else {
      // Calculate time from start/end times
      if (startTime && endTime) {
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        timeSpent = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
      }
    }

    if (timeSpent <= 0) {
      setError('Please enter a valid time spent');
      Analytics.trackJobSearchEvent('Add Activity Attempt', {
        error: 'Invalid time spent',
        timeInputMode: timeMode,
        timeSpent
      });
      return;
    }

    try {
      const activityData = {
        ...newActivity,
        userId: user.uid,
        userEmail: user.email,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date(),
        timeSpent: timeSpent
      };

      await addDoc(collection(db, 'activities'), activityData);
      
      // Track successful activity addition
      Analytics.trackJobSearchEvent('Add Activity Success', {
        activity: newActivity.title.trim(),
        company: newActivity.description.trim(), // Assuming description is company name for job search
        timeSpent,
        timeInputMode: timeMode,
        totalActivities: activities.length + 1
      });

      setNewActivity({
        type: 'job_search',
        title: '',
        description: '',
        timeSpent: 0,
        status: 'completed'
      });
      
      setSuccess('Activity added successfully!');
      loadActivities();
    } catch (err) {
      console.error('Error adding activity:', err);
      setError('Failed to add activity');
      Analytics.trackError('Add Job Search Activity Error', {
        error: err instanceof Error ? err.message : 'Unknown error',
        activity: newActivity.title.trim(),
        company: newActivity.description.trim()
      });
    }
  };

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setIsDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingActivity) return;

    let timeSpent = 0;
    if (timeMode === 'minutes') {
      timeSpent = parseInt(editingActivity.timeSpent.toString()) || 0;
    } else {
      // Calculate time from start/end times
      if (startTime && endTime) {
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        timeSpent = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
      }
    }

    if (timeSpent <= 0) {
      setError('Please enter a valid time spent');
      return;
    }

    try {
      const activityRef = doc(db, 'activities', editingActivity.id);
      await updateDoc(activityRef, {
        type: editingActivity.type,
        title: editingActivity.title,
        description: editingActivity.description,
        timeSpent: timeSpent,
        status: editingActivity.status
      });

      setSuccess('Activity updated successfully!');
      setIsDialogOpen(false);
      setEditingActivity(null);
      loadActivities();
    } catch (err) {
      console.error('Error updating activity:', err);
      setError('Failed to update activity');
      Analytics.trackError('Update Job Search Activity Error', {
        error: err instanceof Error ? err.message : 'Unknown error',
        activityId: editingActivity.id
      });
    }
  };

  const handleDelete = async (activityId: string) => {
    try {
      await deleteDoc(doc(db, 'activities', activityId));
      setSuccess('Activity deleted successfully!');
      loadActivities();
      
      // Track activity deletion
      const activityToDelete = activities.find(a => a.id === activityId);
      Analytics.trackJobSearchEvent('Delete Activity', {
        activityId,
        activity: activityToDelete?.title,
        company: activityToDelete?.description,
        timeSpent: activityToDelete?.timeSpent,
        remainingActivities: activities.length - 1
      });
    } catch (err) {
      console.error('Error deleting activity:', err);
      setError('Failed to delete activity');
      Analytics.trackError('Delete Job Search Activity Error', {
        error: err instanceof Error ? err.message : 'Unknown error',
        activityId
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'planned': return 'info';
      default: return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'job_search' ? 'primary' : 'secondary';
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const todayActivities = activities.filter(activity => 
    activity.date === new Date().toISOString().split('T')[0]
  );

  const totalTimeToday = todayActivities.reduce((total, activity) => total + activity.timeSpent, 0);

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h5" color="error">
          Please sign in to track your job search activities.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Job Search & Upskilling Tracker
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Track your daily activities towards your career goals.
      </Typography>

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

      {/* Today's Summary */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Today's Summary
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Activities Today
            </Typography>
            <Typography variant="h4" color="primary">
              {todayActivities.length}
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Total Time Today
            </Typography>
            <Typography variant="h4" color="primary">
              {formatTime(totalTimeToday)}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Add New Activity Form */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Add New Activity
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
              <Box sx={{ flex: { xs: 'none', md: '1 1 300px' } }}>
                <FormControl fullWidth>
                  <InputLabel>Activity Type</InputLabel>
                  <Select
                    value={newActivity.type}
                    onChange={(e) => setNewActivity({...newActivity, type: e.target.value as 'job_search' | 'upskilling'})}
                    label="Activity Type"
                  >
                    <MenuItem value="job_search">Job Search</MenuItem>
                    <MenuItem value="upskilling">Upskilling</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: { xs: 'none', md: '1 1 300px' } }}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={newActivity.status}
                    onChange={(e) => setNewActivity({...newActivity, status: e.target.value as 'completed' | 'in_progress' | 'planned'})}
                    label="Status"
                  >
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="planned">Planned</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
            <TextField
              fullWidth
              label="Activity Title"
              value={newActivity.title}
              onChange={(e) => setNewActivity({...newActivity, title: e.target.value})}
              placeholder="e.g., Applied to Senior Developer position at Google"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={newActivity.description}
              onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
              multiline
              rows={3}
              placeholder="Describe what you did, what you learned, or any notes..."
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <ToggleButtonGroup
                value={timeMode}
                exclusive
                onChange={(_, val) => val && setTimeMode(val)}
                sx={{ mb: 1 }}
                size="small"
              >
                <ToggleButton value="minutes">Minutes</ToggleButton>
                <ToggleButton value="range">Start/End Time</ToggleButton>
              </ToggleButtonGroup>
              {timeMode === 'minutes' ? (
                <TextField
                  fullWidth
                  label="Time Spent (minutes)"
                  type="number"
                  value={newActivity.timeSpent === 0 ? '' : newActivity.timeSpent}
                  onChange={(e) => setNewActivity({ ...newActivity, timeSpent: parseInt(e.target.value) || 0 })}
                  inputProps={{ min: 0 }}
                  placeholder="0"
                />
              ) : (
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                  <Box sx={{ flex: { xs: 'none', md: 1 } }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Start Time *
                    </Typography>
                    <TextField
                      type="time"
                      value={startTime}
                      onChange={e => {
                        setStartTime(e.target.value);
                        if (e.target.value && endTime) {
                          const [sh, sm] = e.target.value.split(':').map(Number);
                          const [eh, em] = endTime.split(':').map(Number);
                          let mins = (eh * 60 + em) - (sh * 60 + sm);
                          if (mins < 0) mins += 24 * 60; // handle overnight
                          setNewActivity({ ...newActivity, timeSpent: mins });
                        }
                      }}
                      inputProps={{ step: 60 }}
                      required
                      fullWidth
                    />
                  </Box>
                  <Box sx={{ flex: { xs: 'none', md: 1 } }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      End Time *
                    </Typography>
                    <TextField
                      type="time"
                      value={endTime}
                      onChange={e => {
                        setEndTime(e.target.value);
                        if (startTime && e.target.value) {
                          const [sh, sm] = startTime.split(':').map(Number);
                          const [eh, em] = e.target.value.split(':').map(Number);
                          let mins = (eh * 60 + em) - (sh * 60 + sm);
                          if (mins < 0) mins += 24 * 60; // handle overnight
                          setNewActivity({ ...newActivity, timeSpent: mins });
                        }
                      }}
                      inputProps={{ step: 60 }}
                      required
                      fullWidth
                    />
                  </Box>
                  <Box sx={{ width: { xs: '100%', md: 160 } }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Minutes Calculated
                    </Typography>
                    <TextField
                      type="number"
                      value={newActivity.timeSpent}
                      InputProps={{ readOnly: true }}
                      fullWidth
                    />
                  </Box>
                </Box>
              )}
            </Box>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              sx={{ mt: 2 }}
            >
              Add Activity
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Activities List */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Activities
        </Typography>
        {activities.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No activities yet. Add your first activity above!
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {activities.map((activity) => (
              <Card key={activity.id} elevation={1}>
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'flex-start' }, mb: 1, gap: { xs: 2, md: 0 } }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {activity.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {activity.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip 
                          label={activity.type === 'job_search' ? 'Job Search' : 'Upskilling'} 
                          color={getTypeColor(activity.type) as any}
                          size="small"
                        />
                        <Chip 
                          label={activity.status.replace('_', ' ')} 
                          color={getStatusColor(activity.status) as any}
                          size="small"
                        />
                        <Chip 
                          label={formatTime(activity.timeSpent)} 
                          variant="outlined"
                          size="small"
                        />
                        <Chip 
                          label={activity.date} 
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-end', md: 'flex-start' } }}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleEdit(activity)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDelete(activity.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Activity</DialogTitle>
        <DialogContent>
          {editingActivity && (
            <Box sx={{ pt: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: '1 1 300px' }}>
                    <FormControl fullWidth>
                      <InputLabel>Activity Type</InputLabel>
                      <Select
                        value={editingActivity.type}
                        onChange={(e) => setEditingActivity({...editingActivity, type: e.target.value as 'job_search' | 'upskilling'})}
                        label="Activity Type"
                      >
                        <MenuItem value="job_search">Job Search</MenuItem>
                        <MenuItem value="upskilling">Upskilling</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ flex: '1 1 300px' }}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={editingActivity.status}
                        onChange={(e) => setEditingActivity({...editingActivity, status: e.target.value as 'completed' | 'in_progress' | 'planned'})}
                        label="Status"
                      >
                        <MenuItem value="completed">Completed</MenuItem>
                        <MenuItem value="in_progress">In Progress</MenuItem>
                        <MenuItem value="planned">Planned</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
                <TextField
                  fullWidth
                  label="Activity Title"
                  value={editingActivity.title}
                  onChange={(e) => setEditingActivity({...editingActivity, title: e.target.value})}
                  required
                />
                <TextField
                  fullWidth
                  label="Description"
                  value={editingActivity.description}
                  onChange={(e) => setEditingActivity({...editingActivity, description: e.target.value})}
                  multiline
                  rows={3}
                />
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: '1 1 300px' }}>
                    <TextField
                      fullWidth
                      label="Time Spent (minutes)"
                      type="number"
                      value={editingActivity.timeSpent}
                      onChange={(e) => setEditingActivity({...editingActivity, timeSpent: parseInt(e.target.value) || 0})}
                      inputProps={{ min: 0 }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default JobSearchTracker;

