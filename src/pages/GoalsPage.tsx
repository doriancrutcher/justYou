import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Button, TextField, Checkbox, List, ListItem, ListItemText, IconButton, Divider, Paper } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { collection, getDocs, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/AuthContext';
import { v4 as uuidv4 } from 'uuid';

interface Task {
  id: string;
  text: string;
  completed: boolean;
}
interface Suggestion {
  id: string;
  text: string;
  suggestedBy: string;
}
interface GoalCategory {
  id: string;
  category: string;
  tasks: Task[];
  suggestions: Suggestion[];
}

const GoalsPage: React.FC = () => {
  const { user } = useAuth();
  const isOwner = user?.email === process.env.REACT_APP_ADMIN_EMAIL;
  const [categories, setCategories] = useState<GoalCategory[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [newTask, setNewTask] = useState<{ [catId: string]: string }>({});
  const [suggestions, setSuggestions] = useState<{ [catId: string]: string }>({});
  const [loading, setLoading] = useState(false);

  // Fetch categories from Firestore
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'goals'));
      const cats = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GoalCategory[];
      setCategories(cats);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Add new category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    try {
      const newCat: GoalCategory = {
        id: uuidv4(),
        category: newCategory,
        tasks: [],
        suggestions: [],
      };
      await setDoc(doc(db, 'goals', newCat.id), newCat);
      setCategories([...categories, newCat]);
      setNewCategory('');
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  // Add new task (only owner)
  const handleAddTask = async (catId: string) => {
    const text = newTask[catId]?.trim();
    if (!text) return;
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;
    const updatedTasks = [...cat.tasks, { id: uuidv4(), text, completed: false }];
    await updateDoc(doc(db, 'goals', catId), { tasks: updatedTasks });
    setCategories(categories.map(c => c.id === catId ? { ...c, tasks: updatedTasks } : c));
    setNewTask({ ...newTask, [catId]: '' });
  };

  // Toggle task completion (only owner)
  const handleToggleTask = async (catId: string, taskId: string) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;
    const updatedTasks = cat.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    await updateDoc(doc(db, 'goals', catId), { tasks: updatedTasks });
    setCategories(categories.map(c => c.id === catId ? { ...c, tasks: updatedTasks } : c));
  };

  // Delete task (only owner)
  const handleDeleteTask = async (catId: string, taskId: string) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;
    const updatedTasks = cat.tasks.filter(t => t.id !== taskId);
    await updateDoc(doc(db, 'goals', catId), { tasks: updatedTasks });
    setCategories(categories.map(c => c.id === catId ? { ...c, tasks: updatedTasks } : c));
  };

  // Delete category (only owner)
  const handleDeleteCategory = async (catId: string) => {
    await deleteDoc(doc(db, 'goals', catId));
    setCategories(categories.filter(c => c.id !== catId));
  };

  // Suggest a goal (anyone but owner)
  const handleSuggest = async (catId: string) => {
    const text = suggestions[catId]?.trim();
    if (!text || isOwner) return;
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;
    const newSuggestion: Suggestion = { id: uuidv4(), text, suggestedBy: user?.email || 'anonymous' };
    const updatedSuggestions = [...cat.suggestions, newSuggestion];
    await updateDoc(doc(db, 'goals', catId), { suggestions: updatedSuggestions });
    setCategories(categories.map(c => c.id === catId ? { ...c, suggestions: updatedSuggestions } : c));
    setSuggestions({ ...suggestions, [catId]: '' });
  };

  // Approve suggestion (only owner)
  const handleApproveSuggestion = async (catId: string, suggestion: Suggestion) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;
    const updatedTasks = [...cat.tasks, { id: uuidv4(), text: suggestion.text, completed: false }];
    const updatedSuggestions = cat.suggestions.filter(s => s.id !== suggestion.id);
    await updateDoc(doc(db, 'goals', catId), { tasks: updatedTasks, suggestions: updatedSuggestions });
    setCategories(categories.map(c => c.id === catId ? { ...c, tasks: updatedTasks, suggestions: updatedSuggestions } : c));
  };

  // Delete suggestion (only owner)
  const handleDeleteSuggestion = async (catId: string, suggestionId: string) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;
    const updatedSuggestions = cat.suggestions.filter(s => s.id !== suggestionId);
    await updateDoc(doc(db, 'goals', catId), { suggestions: updatedSuggestions });
    setCategories(categories.map(c => c.id === catId ? { ...c, suggestions: updatedSuggestions } : c));
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Goals
      </Typography>
      {isOwner && (
        <Box component="form" onSubmit={handleAddCategory} sx={{ display: 'flex', mb: 3 }}>
          <TextField
            fullWidth
            label="Add a new category"
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
          />
          <Button type="submit" variant="contained" sx={{ ml: 2 }}>
            Add Category
          </Button>
        </Box>
      )}
      {categories.map(cat => (
        <Paper key={cat.id} sx={{ mb: 4, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>{cat.category}</Typography>
            {isOwner && (
              <IconButton onClick={() => handleDeleteCategory(cat.id)}><DeleteIcon /></IconButton>
            )}
          </Box>
          <Divider sx={{ mb: 2 }} />
          <List>
            {cat.tasks.map(task => (
              <ListItem key={task.id} disablePadding>
                {isOwner ? (
                  <Checkbox checked={task.completed} onChange={() => handleToggleTask(cat.id, task.id)} />
                ) : (
                  <Checkbox checked={task.completed} disabled />
                )}
                <ListItemText primary={task.text} sx={{ textDecoration: task.completed ? 'line-through' : 'none' }} />
                {isOwner && (
                  <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteTask(cat.id, task.id)}>
                    <DeleteIcon />
                  </IconButton>
                )}
              </ListItem>
            ))}
          </List>
          {isOwner ? (
            <Box sx={{ display: 'flex', mt: 1 }}>
              <TextField
                fullWidth
                label="Add a new goal"
                value={newTask[cat.id] || ''}
                onChange={e => setNewTask({ ...newTask, [cat.id]: e.target.value })}
              />
              <Button variant="contained" sx={{ ml: 2 }} onClick={() => handleAddTask(cat.id)}>
                Add Goal
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', mt: 1 }}>
              <TextField
                fullWidth
                label="Suggest a goal"
                value={suggestions[cat.id] || ''}
                onChange={e => setSuggestions({ ...suggestions, [cat.id]: e.target.value })}
              />
              <Button variant="contained" sx={{ ml: 2 }} onClick={() => handleSuggest(cat.id)}>
                Suggest
              </Button>
            </Box>
          )}
          {/* Suggestions List (only owner) */}
          {isOwner && cat.suggestions.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">Suggestions:</Typography>
              <List>
                {cat.suggestions.map(s => (
                  <ListItem key={s.id} secondaryAction={
                    <>
                      <Button color="primary" onClick={() => handleApproveSuggestion(cat.id, s)} sx={{ mr: 1 }}>Approve</Button>
                      <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteSuggestion(cat.id, s.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </>
                  }>
                    <ListItemText primary={s.text} secondary={`Suggested by: ${s.suggestedBy}`} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Paper>
      ))}
      {loading && <Typography sx={{ mt: 2 }}>Loading...</Typography>}
    </Container>
  );
};

export default GoalsPage; 