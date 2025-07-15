import React, { useEffect, useState, useCallback } from 'react';
import { Container, Typography, TextField, Button, List, ListItem, Checkbox, ListItemText, IconButton, Box } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/AuthContext';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  userId: string; // Add user ID to tie todos to specific user
}

const TodoList: React.FC = () => {
  const { user, signInWithGoogle } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchTodos = useCallback(async () => {
    if (!user) {
      setTodos([]);
      return;
    }

    setLoading(true);
    try {
      // Query todos for the current user only
      const todosQuery = query(
        collection(db, 'todos'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(todosQuery);
      const todosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Todo[];
      setTodos(todosData);
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]); // Re-fetch when user changes

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTodo.trim()) return;
    
    try {
      const docRef = await addDoc(collection(db, 'todos'), {
        text: newTodo,
        completed: false,
        userId: user.uid, // Tie to current user
      });
      setTodos([...todos, { id: docRef.id, text: newTodo, completed: false, userId: user.uid }]);
      setNewTodo('');
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const handleToggle = async (id: string, completed: boolean) => {
    if (!user) return;
    
    try {
      await updateDoc(doc(db, 'todos', id), { completed: !completed });
      setTodos(todos.map(todo => todo.id === id ? { ...todo, completed: !completed } : todo));
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    
    try {
      await deleteDoc(doc(db, 'todos', id));
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Your Personal Todo List
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Sign in to access your personal task management features.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={signInWithGoogle}
            sx={{ borderRadius: 2, textTransform: 'none', px: 4, py: 1.5 }}
          >
            Sign in to Access Todos
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Your Todo List
      </Typography>
      <Box component="form" onSubmit={handleAddTodo} sx={{ display: 'flex', mb: 2 }}>
        <TextField
          fullWidth
          label="Add a new task"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
        />
        <Button type="submit" variant="contained" sx={{ ml: 2 }}>
          Add
        </Button>
      </Box>
      <List>
        {todos.map((todo) => (
          <ListItem
            key={todo.id}
            secondaryAction={
              <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(todo.id)}>
                <DeleteIcon />
              </IconButton>
            }
            disablePadding
          >
            <Checkbox
              checked={todo.completed}
              onChange={() => handleToggle(todo.id, todo.completed)}
            />
            <ListItemText primary={todo.text} sx={{ textDecoration: todo.completed ? 'line-through' : 'none' }} />
          </ListItem>
        ))}
      </List>
      {loading && <Typography sx={{ mt: 2 }}>Loading...</Typography>}
      {todos.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No todos yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add your first task to get started.
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default TodoList; 