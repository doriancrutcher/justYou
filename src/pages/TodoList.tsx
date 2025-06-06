import React, { useEffect, useState } from 'react';
import { Container, Typography, TextField, Button, List, ListItem, Checkbox, ListItemText, IconButton, Box } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchTodos = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'todos'));
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
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    try {
      const docRef = await addDoc(collection(db, 'todos'), {
        text: newTodo,
        completed: false,
      });
      setTodos([...todos, { id: docRef.id, text: newTodo, completed: false }]);
      setNewTodo('');
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const handleToggle = async (id: string, completed: boolean) => {
    try {
      await updateDoc(doc(db, 'todos', id), { completed: !completed });
      setTodos(todos.map(todo => todo.id === id ? { ...todo, completed: !completed } : todo));
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'todos', id));
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Todo List
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
    </Container>
  );
};

export default TodoList; 