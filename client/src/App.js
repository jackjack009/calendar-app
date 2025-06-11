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
    try {
      const response = await axios.get(`${API_URL}/api/date-titles`);
      const titlesMap = response.data.reduce((acc, item) => {
        acc[item.date] = item.title;
        return acc;
      }, {});
      setDateTitles(titlesMap);
    } catch (error) {
      console.error('Error fetching date titles:', error);
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