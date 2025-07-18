import React, { useEffect, useState, useCallback } from 'react';
import { Container, Typography, Box, Button, TextField, Checkbox, List, ListItem, ListItemText, IconButton, Divider, Paper } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { collection, getDocs, updateDoc, deleteDoc, doc, setDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/AuthContext';
import { Analytics } from '../mixpanel';
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
  userId: string; // Add user ID to tie goals to specific user
}

const GoalsPage: React.FC = () => {
  console.log('GoalsPage component rendering');
  const { user, signInWithGoogle } = useAuth();
  const [categories, setCategories] = useState<GoalCategory[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [newTask, setNewTask] = useState<{ [catId: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{ type: 'category' | 'task', id: string, categoryId?: string } | null>(null);

  // Track page load
  useEffect(() => {
    Analytics.trackFeatureUsage('Goals Page', {
      isAuthenticated: !!user,
      categoriesCount: categories.length
    });
  }, [user, categories.length]);

  // Fetch categories from Firestore - only for authenticated user
  const fetchCategories = useCallback(async () => {
    console.log('Fetching categories...');
    console.log('User:', user);
    console.log('Firebase db object:', db);
    
    if (!user) {
      console.log('No user found, setting empty categories');
      setCategories([]);
      return;
    }

    setLoading(true);
    try {
      console.log('Querying Firestore for user:', user.uid);
      // Query goals for the current user only
      const goalsQuery = query(
        collection(db, 'goals'),
        where('userId', '==', user.uid)
      );
      console.log('Goals query created:', goalsQuery);
      const querySnapshot = await getDocs(goalsQuery);
      console.log('Query snapshot size:', querySnapshot.size);
      
      const cats = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GoalCategory[];
      console.log('Raw categories from Firestore:', cats);
      
      // Sort by order if it exists, otherwise by creation time
      const sortedCats = cats.sort((a, b) => (a.order || 0) - (b.order || 0));
      console.log('Sorted categories:', sortedCats);
      
      setCategories(sortedCats);
      console.log('Categories set in state');
      
      // Track successful fetch
      Analytics.trackGoalEvent('Fetch Categories', 'Success', {
        categoriesCount: sortedCats.length,
        userId: user.uid
      });
    } catch (error) {
      console.error('Error fetching goals:', error);
      console.error('Error details:', error);
      Analytics.trackError('Fetch Goals Error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: user?.uid
      });
    } finally {
      setLoading(false);
      console.log('Loading set to false');
    }
  }, [user]);

  useEffect(() => {
    console.log('GoalsPage useEffect triggered');
    console.log('User state:', user);
    console.log('fetchCategories function:', fetchCategories);
    fetchCategories();
  }, [fetchCategories]); // Re-fetch when user changes

  // Add new category - only for authenticated users
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Add Category button pressed!');
    console.log('User:', user);
    console.log('New category text:', newCategory);
    
    if (!user) {
      console.log('No user found - authentication required');
      return;
    }
    
    if (!newCategory.trim()) {
      console.log('No category text entered');
      return;
    }
    
    try {
      console.log('Creating new category...');
      const newCat: GoalCategory = {
        id: uuidv4(),
        category: newCategory,
        tasks: [],
        suggestions: [],
        order: categories.length,
        userId: user.uid, // Tie to current user
      };
      console.log('New category object:', newCat);
      
      console.log('Saving to Firestore...');
      await setDoc(doc(db, 'goals', newCat.id), newCat);
      console.log('Successfully saved to Firestore');
      
      console.log('Updating local state...');
      setCategories([...categories, newCat]);
      setNewCategory('');
      console.log('Local state updated successfully');
      
      // Track category creation
      Analytics.trackGoalEvent('Create Category', 'Category', {
        categoryName: newCategory,
        totalCategories: categories.length + 1,
        userId: user.uid
      });
    } catch (error) {
      console.error('Error adding category:', error);
      Analytics.trackError('Create Category Error', {
        categoryName: newCategory,
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: user?.uid
      });
    }
  };

  // Add new task - only for authenticated users
  const handleAddTask = async (catId: string) => {
    console.log('Add Goal button pressed!');
    console.log('Category ID:', catId);
    console.log('User:', user);
    
    if (!user) {
      console.log('No user found - authentication required');
      return;
    }
    
    const text = newTask[catId]?.trim();
    console.log('Task text:', text);
    
    if (!text) {
      console.log('No task text entered');
      return;
    }
    
    const cat = categories.find(c => c.id === catId);
    console.log('Found category:', cat);
    
    if (!cat) {
      console.log('Category not found');
      return;
    }
    
    try {
      console.log('Creating new task...');
      const newTaskItem: Task = { 
        id: uuidv4(), 
        text, 
        completed: false, 
        order: cat.tasks.length 
      };
      console.log('New task object:', newTaskItem);
      
      const updatedTasks = [...cat.tasks, newTaskItem];
      console.log('Updated tasks array:', updatedTasks);
      
      console.log('Saving to Firestore...');
      await updateDoc(doc(db, 'goals', catId), { tasks: updatedTasks });
      console.log('Successfully saved to Firestore');
      
      console.log('Updating local state...');
      setCategories(categories.map(c => c.id === catId ? { ...c, tasks: updatedTasks } : c));
      setNewTask({ ...newTask, [catId]: '' });
      console.log('Local state updated successfully');
      
      // Track task creation
      Analytics.trackGoalEvent('Create Task', 'Task', {
        categoryName: cat.category,
        taskText: text,
        totalTasksInCategory: updatedTasks.length,
        userId: user.uid
      });
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  // Toggle task completion - only for authenticated users
  const handleToggleTask = async (catId: string, taskId: string) => {
    if (!user) return;
    
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;
    const task = cat.tasks.find(t => t.id === taskId);
    const updatedTasks = cat.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    await updateDoc(doc(db, 'goals', catId), { tasks: updatedTasks });
    setCategories(categories.map(c => c.id === catId ? { ...c, tasks: updatedTasks } : c));
    
    // Track task completion toggle
    Analytics.trackGoalEvent('Toggle Task', 'Task', {
      categoryName: cat.category,
      taskText: task?.text,
      completed: !task?.completed,
      userId: user.uid
    });
  };

  // Delete task - only for authenticated users
  const handleDeleteTask = async (catId: string, taskId: string) => {
    if (!user) return;
    
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;
    const task = cat.tasks.find(t => t.id === taskId);
    const updatedTasks = cat.tasks.filter(t => t.id !== taskId);
    // Reorder remaining tasks
    const reorderedTasks = updatedTasks.map((task, index) => ({ ...task, order: index }));
    await updateDoc(doc(db, 'goals', catId), { tasks: reorderedTasks });
    setCategories(categories.map(c => c.id === catId ? { ...c, tasks: reorderedTasks } : c));
    
    // Track task deletion
    Analytics.trackGoalEvent('Delete Task', 'Task', {
      categoryName: cat.category,
      taskText: task?.text,
      remainingTasksInCategory: reorderedTasks.length,
      userId: user.uid
    });
  };

  // Delete category - only for authenticated users
  const handleDeleteCategory = async (catId: string) => {
    if (!user) return;
    
    const cat = categories.find(c => c.id === catId);
    await deleteDoc(doc(db, 'goals', catId));
    const updatedCategories = categories.filter(c => c.id !== catId);
    // Reorder remaining categories
    const reorderedCategories = updatedCategories.map((cat, index) => ({ ...cat, order: index }));
    setCategories(reorderedCategories);
    // Update order in database
    reorderedCategories.forEach(async (cat) => {
      await updateDoc(doc(db, 'goals', cat.id), { order: cat.order });
    });
    
    // Track category deletion
    Analytics.trackGoalEvent('Delete Category', 'Category', {
      categoryName: cat?.category,
      tasksInCategory: cat?.tasks.length || 0,
      remainingCategories: reorderedCategories.length,
      userId: user.uid
    });
  };

  // Approve suggestion - only for authenticated users
  const handleApproveSuggestion = async (catId: string, suggestion: Suggestion) => {
    if (!user) return;
    
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
    
    // Track suggestion approval
    Analytics.trackGoalEvent('Approve Suggestion', 'Suggestion', {
      categoryName: cat.category,
      suggestionText: suggestion.text,
      suggestedBy: suggestion.suggestedBy,
      userId: user.uid
    });
  };

  // Delete suggestion - only for authenticated users
  const handleDeleteSuggestion = async (catId: string, suggestionId: string) => {
    if (!user) return;
    
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;
    const suggestion = cat.suggestions.find(s => s.id === suggestionId);
    const updatedSuggestions = cat.suggestions.filter(s => s.id !== suggestionId);
    await updateDoc(doc(db, 'goals', catId), { suggestions: updatedSuggestions });
    setCategories(categories.map(c => c.id === catId ? { ...c, suggestions: updatedSuggestions } : c));
    
    // Track suggestion deletion
    Analytics.trackGoalEvent('Delete Suggestion', 'Suggestion', {
      categoryName: cat.category,
      suggestionText: suggestion?.text,
      suggestedBy: suggestion?.suggestedBy,
      userId: user.uid
    });
  };

  // Drag and drop handlers - only for authenticated users
  const handleDragStart = (e: React.DragEvent, type: 'category' | 'task', id: string, categoryId?: string) => {
    if (!user) return;
    
    setDraggedItem({ type, id, categoryId });
    e.dataTransfer.effectAllowed = 'move';
    
    // Track drag start
    Analytics.trackGoalEvent('Start Drag', type === 'category' ? 'Category' : 'Task', {
      itemId: id,
      categoryId,
      userId: user.uid
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetType: 'category' | 'task', targetId: string, targetCategoryId?: string) => {
    e.preventDefault();
    if (!draggedItem || !user) return;

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
      
      // Track category reorder
      Analytics.trackGoalEvent('Reorder Category', 'Category', {
        categoryName: draggedCategory.category,
        fromIndex: draggedIndex,
        toIndex: targetIndex,
        userId: user.uid
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
      
      // Track task reorder
      Analytics.trackGoalEvent('Reorder Task', 'Task', {
        categoryName: category.category,
        taskText: draggedTask.text,
        fromIndex: draggedIndex,
        toIndex: targetIndex,
        userId: user.uid
      });
    }

    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Your Personal Goals
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Sign in to access your personal goal tracking and management features.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={signInWithGoogle}
            sx={{ borderRadius: 2, textTransform: 'none', px: 4, py: 1.5 }}
          >
            Sign in to Access Goals
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Your Goals
      </Typography>
      <Box component="form" onSubmit={handleAddCategory} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 0 }, mb: 3 }}>
        <TextField
          fullWidth
          label="Add a new category"
          value={newCategory}
          onChange={e => {
            console.log('Category input changed:', e.target.value);
            setNewCategory(e.target.value);
          }}
          required
        />
        <Button 
          type="submit" 
          variant="contained" 
          disabled={!newCategory.trim()}
          sx={{ ml: { xs: 0, sm: 2 }, minWidth: { xs: '100%', sm: 'auto' } }}
        >
          Add Category
        </Button>
      </Box>
      
      {categories.map((cat, catIndex) => (
        <Paper 
          key={cat.id} 
          sx={{ 
            mb: 4, 
            p: 2,
            opacity: draggedItem?.type === 'category' && draggedItem.id === cat.id ? 0.5 : 1,
            cursor: 'grab',
            '&:active': { cursor: 'grabbing' }
          }}
          draggable
          onDragStart={(e) => handleDragStart(e, 'category', cat.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'category', cat.id)}
          onDragEnd={handleDragEnd}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <DragIndicatorIcon sx={{ mr: 1, color: 'text.secondary', cursor: 'grab' }} />
            <Typography variant="h6" sx={{ flexGrow: 1 }}>{cat.category}</Typography>
            <IconButton onClick={() => handleDeleteCategory(cat.id)}><DeleteIcon /></IconButton>
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
                cursor: 'grab',
                '&:active': { cursor: 'grabbing' }
              }}
              draggable
              onDragStart={(e) => handleDragStart(e, 'task', task.id, cat.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'task', task.id, cat.id)}
              onDragEnd={handleDragEnd}
            >
              <DragIndicatorIcon sx={{ mr: 1, color: 'text.secondary', cursor: 'grab' }} />
              <Checkbox 
                checked={task.completed} 
                onChange={() => handleToggleTask(cat.id, task.id)}
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
              <IconButton 
                edge="end" 
                aria-label="delete" 
                onClick={() => handleDeleteTask(cat.id, task.id)}
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 0 }, mt: 1 }}>
            <TextField
              fullWidth
              label="Add a new goal"
              value={newTask[cat.id] || ''}
              onChange={e => {
                console.log('Goal input changed for category', cat.id, ':', e.target.value);
                setNewTask({ ...newTask, [cat.id]: e.target.value });
              }}
              required
            />
            <Button 
              variant="contained" 
              disabled={!newTask[cat.id]?.trim()}
              sx={{ ml: { xs: 0, sm: 2 }, minWidth: { xs: '100%', sm: 'auto' } }} 
              onClick={() => handleAddTask(cat.id)}
            >
              Add Goal
            </Button>
          </Box>
          
          {/* Suggestions List */}
          {cat.suggestions.length > 0 && (
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
      
      {categories.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No goals yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create your first category to get started with goal tracking.
          </Typography>
        </Box>
      )}
      
      <Box sx={{ mt: 3, p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          💡 <strong>Tip:</strong> Drag and drop categories and goals to reorder them.
        </Typography>
      </Box>
    </Container>
  );
};

export default GoalsPage; 