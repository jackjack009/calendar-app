import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import axios from 'axios';
import Calendar from './Calendar';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function getNextSunday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  if (day === 0) {
    d.setHours(0, 0, 0, 0);
    return d;
  }
  d.setDate(d.getDate() + (7 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

function AdminView({ dateTitles, refreshDateTitles }) {
  const [slots, setSlots] = useState([]);
  const [currentDate, setCurrentDate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // State to hold the generated Sundays from Calendar
  const [generatedSundays, setGeneratedSundays] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const fetchSlots = async (dateString) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get(
        `${API_URL}/api/slots/week/${dateString}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setSlots(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching slots:', error);
      setError(error);
      setIsLoading(false);
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
      }
    }
  };

  useEffect(() => {
    if (currentDate) {
      fetchSlots(currentDate);
      refreshDateTitles();
    }
  }, [currentDate, refreshDateTitles]);

  // Effect to set initial date based on generated Sundays
  useEffect(() => {
    if (!currentDate && generatedSundays.length > 0) {
      setCurrentDate(generatedSundays[0]);
    }
  }, [currentDate, generatedSundays]);

  const handleDateSelect = (dateKey) => {
    setCurrentDate(dateKey);
  };

  const handleSlotClick = async (slot) => {
    try {
      const response = await axios.patch(
        `${API_URL}/api/slots/${slot._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setSlots(slots.map((s) => (s._id === slot._id ? response.data : s)));
      setNotification({
        open: true,
        message: 'Slot availability updated successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error updating slot:', error);
      setNotification({
        open: true,
        message: 'Error updating slot availability',
        severity: 'error',
      });
    }
  };

  const handlePreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(getNextSunday(newDate).toISOString().split('T')[0]);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(getNextSunday(newDate).toISOString().split('T')[0]);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const isPreviousWeekDisabled = new Date(currentDate) <= getNextSunday(new Date());

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Button variant="contained" onClick={() => navigate('/')}>
            Home
          </Button>
          <Button variant="contained" color="secondary" onClick={logout}>
            Logout
          </Button>
        </Box>

        <Typography variant="h4" component="h1" gutterBottom align="center">
          Manage Time Slots
        </Typography>

        <Typography variant="h4" component="h1" align="center" sx={{ mb: 3 }}>
          Lịch để check coi Jack ế show đến đâu. Muốn búc thì nhắm cái nào Available nghen. Iu thương~
        </Typography>

        <Calendar 
          slots={slots} 
          dateTitles={dateTitles}
          onSlotClick={handleSlotClick} 
          isAdmin={true} 
          onDateTitleUpdate={refreshDateTitles}
          onDateSelect={handleDateSelect}
          selectedDate={currentDate}
          onSundaysGenerated={setGeneratedSundays}
        />

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <Typography variant="h6">Loading slots...</Typography>
          </Box>
        )}
        {error && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <Typography variant="h6" color="error">Error: {error.message}</Typography>
          </Box>
        )}

        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
}

export default AdminView; 