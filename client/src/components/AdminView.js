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

function AdminView() {
  const [slots, setSlots] = useState([]);
  const [currentDate, setCurrentDate] = useState(getNextSunday());
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const fetchSlots = async (date) => {
    try {
      const sunday = getNextSunday(date);
      const response = await axios.get(
        `http://localhost:5000/api/slots/week/${sunday.toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setSlots(response.data);
    } catch (error) {
      console.error('Error fetching slots:', error);
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
      }
    }
  };

  useEffect(() => {
    fetchSlots(currentDate);
  }, [currentDate]);

  const handleSlotClick = async (slot) => {
    try {
      const response = await axios.patch(
        `http://localhost:5000/api/slots/${slot._id}`,
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
    if (newDate >= getNextSunday(new Date(0))) {
      setCurrentDate(getNextSunday(newDate));
    }
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(getNextSunday(newDate));
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

        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handlePreviousWeek} disabled={currentDate <= getNextSunday(new Date())}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ mx: 2 }}>
            {formatDate(currentDate)}
          </Typography>
          <IconButton onClick={handleNextWeek}>
            <ArrowForward />
          </IconButton>
        </Box>

        <Calendar slots={slots} onSlotClick={handleSlotClick} isAdmin={true} />

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