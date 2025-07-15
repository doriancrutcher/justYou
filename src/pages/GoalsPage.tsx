import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Button, TextField, Checkbox, List, ListItem, ListItemText, IconButton, Divider, Paper, Chip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { collection, getDocs, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/AuthContext';
import { v4 as uuidv4 } from 'uuid';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  order: number;
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
  order: number;
}

const GoalsPage: React.FC = () => {
  const { user } = useAuth();
  const isOwner = user?.email === process.env.REACT_APP_ADMIN_EMAIL;
  const [categories, setCategories] = useState<GoalCategory[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [newTask, setNewTask] = useState<{ [catId: string]: string }>({});
  const [suggestions, setSuggestions] = useState<{ [catId: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{ type: 'category' | 'task', id: string, categoryId?: string } | null>(null);

  // Fetch categories from Firestore
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'goals'));
      const cats = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GoalCategory[];
      // Sort by order if it exists, otherwise by creation time
      const sortedCats = cats.sort((a, b) => (a.order || 0) - (b.order || 0));
      setCategories(sortedCats);
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
        order: categories.length,
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
    const newTaskItem: Task = { 
      id: uuidv4(), 
      text, 
      completed: false, 
      order: cat.tasks.length 
    };
    const updatedTasks = [...cat.tasks, newTaskItem];
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
    // Reorder remaining tasks
    const reorderedTasks = updatedTasks.map((task, index) => ({ ...task, order: index }));
    await updateDoc(doc(db, 'goals', catId), { tasks: reorderedTasks });
    setCategories(categories.map(c => c.id === catId ? { ...c, tasks: reorderedTasks } : c));
  };

  // Delete category (only owner)
  const handleDeleteCategory = async (catId: string) => {
    await deleteDoc(doc(db, 'goals', catId));
    const updatedCategories = categories.filter(c => c.id !== catId);
    // Reorder remaining categories
    const reorderedCategories = updatedCategories.map((cat, index) => ({ ...cat, order: index }));
    setCategories(reorderedCategories);
    // Update order in database
    reorderedCategories.forEach(async (cat) => {
      await updateDoc(doc(db, 'goals', cat.id), { order: cat.order });
    });
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
    const newTask: Task = { 
      id: uuidv4(), 
      text: suggestion.text, 
      completed: false, 
      order: cat.tasks.length 
    };
    const updatedTasks = [...cat.tasks, newTask];
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

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, type: 'category' | 'task', id: string, categoryId?: string) => {
    setDraggedItem({ type, id, categoryId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetType: 'category' | 'task', targetId: string, targetCategoryId?: string) => {
    e.preventDefault();
    if (!draggedItem || !isOwner) return;

    if (draggedItem.type === 'category' && targetType === 'category') {
      // Reorder categories
      const draggedIndex = categories.findIndex(c => c.id === draggedItem.id);
      const targetIndex = categories.findIndex(c => c.id === targetId);
      
      if (draggedIndex === targetIndex) return;

      const newCategories = [...categories];
      const [draggedCategory] = newCategories.splice(draggedIndex, 1);
      newCategories.splice(targetIndex, 0, draggedCategory);

      // Update order numbers
      const reorderedCategories = newCategories.map((cat, index) => ({ ...cat, order: index }));
      setCategories(reorderedCategories);

      // Update in database
      reorderedCategories.forEach(async (cat) => {
        await updateDoc(doc(db, 'goals', cat.id), { order: cat.order });
      });
    } else if (draggedItem.type === 'task' && targetType === 'task' && draggedItem.categoryId === targetCategoryId && targetCategoryId) {
      // Reorder tasks within the same category
      const category = categories.find(c => c.id === targetCategoryId);
      if (!category || !targetCategoryId) return;

      const draggedIndex = category.tasks.findIndex(t => t.id === draggedItem.id);
      const targetIndex = category.tasks.findIndex(t => t.id === targetId);
      
      if (draggedIndex === targetIndex) return;

      const newTasks = [...category.tasks];
      const [draggedTask] = newTasks.splice(draggedIndex, 1);
      newTasks.splice(targetIndex, 0, draggedTask);

      // Update order numbers
      const reorderedTasks = newTasks.map((task, index) => ({ ...task, order: index }));
      const updatedCategory = { ...category, tasks: reorderedTasks };
      
      setCategories(categories.map(c => c.id === targetCategoryId ? updatedCategory : c));
      
      // Update in database
      await updateDoc(doc(db, 'goals', targetCategoryId), { tasks: reorderedTasks });
    }

    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
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
      
      {categories.map((cat, catIndex) => (
        <Paper 
          key={cat.id} 
          sx={{ 
            mb: 4, 
            p: 2,
            opacity: draggedItem?.type === 'category' && draggedItem.id === cat.id ? 0.5 : 1,
            cursor: isOwner ? 'grab' : 'default',
            '&:active': { cursor: isOwner ? 'grabbing' : 'default' }
          }}
          draggable={isOwner}
          onDragStart={(e) => handleDragStart(e, 'category', cat.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'category', cat.id)}
          onDragEnd={handleDragEnd}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            {isOwner && (
              <DragIndicatorIcon sx={{ mr: 1, color: 'text.secondary', cursor: 'grab' }} />
            )}
            <Typography variant="h6" sx={{ flexGrow: 1 }}>{cat.category}</Typography>
            {isOwner && (
              <IconButton onClick={() => handleDeleteCategory(cat.id)}><DeleteIcon /></IconButton>
            )}
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          {/* Sort tasks by order */}
          {cat.tasks.sort((a, b) => (a.order || 0) - (b.order || 0)).map((task, taskIndex) => (
            <Box
              key={task.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: 1,
                mb: 1,
                border: '1px solid transparent',
                borderRadius: 1,
                opacity: draggedItem?.type === 'task' && draggedItem.id === task.id ? 0.5 : 1,
                cursor: isOwner ? 'grab' : 'default',
                '&:active': { cursor: isOwner ? 'grabbing' : 'default' }
              }}
              draggable={isOwner}
              onDragStart={(e) => handleDragStart(e, 'task', task.id, cat.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'task', task.id, cat.id)}
              onDragEnd={handleDragEnd}
            >
              {isOwner && (
                <DragIndicatorIcon sx={{ mr: 1, color: 'text.secondary', cursor: 'grab' }} />
              )}
              <Checkbox 
                checked={task.completed} 
                onChange={() => handleToggleTask(cat.id, task.id)}
                disabled={!isOwner}
              />
              <Box sx={{ flexGrow: 1 }}>
                <Typography 
                  sx={{ 
                    textDecoration: task.completed ? 'line-through' : 'none',
                    color: task.completed ? 'text.secondary' : 'text.primary'
                  }}
                >
                  {task.text}
                </Typography>
              </Box>
              {isOwner && (
                <IconButton 
                  edge="end" 
                  aria-label="delete" 
                  onClick={() => handleDeleteTask(cat.id, task.id)}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
          ))}
          
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
      
      {isOwner && categories.length > 0 && (
        <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            💡 <strong>Tip:</strong> Drag and drop categories and goals to reorder them. Only you can reorder items.
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default GoalsPage; 