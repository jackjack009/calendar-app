import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import UserView from './components/UserView';
import AdminView from './components/AdminView';
import Login from './components/Login';
import { AuthProvider } from './contexts/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [dateTitles, setDateTitles] = useState({});

  const fetchDateTitles = useCallback(async () => {
    const maxRetries = 5;
    const baseDelay = 1000; // 1 second

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await axios.get(`${API_URL}/api/date-titles`);
        const titlesMap = response.data.reduce((acc, item) => {
          acc[item.date] = item.title;
          return acc;
        }, {});
        setDateTitles(titlesMap);
        return; // Success, exit the function
      } catch (error) {
        console.error(`Error fetching date titles (attempt ${attempt + 1}/${maxRetries}):`, error);
        
        if (attempt === maxRetries - 1) {
          // Last attempt failed
          console.error('All retry attempts failed');
          return;
        }

        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }, []);

  useEffect(() => {
    fetchDateTitles();
  }, [fetchDateTitles]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<UserView dateTitles={dateTitles} refreshDateTitles={fetchDateTitles} />} />
            <Route path="/admin" element={<AdminView dateTitles={dateTitles} refreshDateTitles={fetchDateTitles} />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 