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
import { formatDateToYYYYMMDD, createLocalDateFromYYYYMMDD, getSundayOfWeek } from '../utils/dateUtils';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function AdminView({ dateTitles, refreshDateTitles, isLoadingDateTitles }) {
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
    const maxRetries = 5;
    const baseDelay = 1000; // 1 second

    for (let attempt = 0; attempt < maxRetries; attempt++) {
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
        return; // Success, exit the function
      } catch (error) {
        console.error(`Error fetching slots (attempt ${attempt + 1}/${maxRetries}):`, error);
        
        if (attempt === maxRetries - 1) {
          // Last attempt failed
          setError(error);
          setIsLoading(false);
          if (error.response?.status === 401) {
            logout();
            navigate('/login');
          }
          return;
        }

        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
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
    const newDate = createLocalDateFromYYYYMMDD(currentDate); 
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(formatDateToYYYYMMDD(newDate));
  };

  const handleNextWeek = () => {
    const newDate = createLocalDateFromYYYYMMDD(currentDate); 
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(formatDateToYYYYMMDD(newDate));
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

  // Compare current date with the first generated Sunday (which is the nearest upcoming Sunday)
  const isPreviousWeekDisabled = currentDate && generatedSundays.length > 0 && 
                                 createLocalDateFromYYYYMMDD(currentDate).getTime() <=
                                 createLocalDateFromYYYYMMDD(generatedSundays[0]).getTime();

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

        {(isLoading || isLoadingDateTitles || error) ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 200, my: 4 }}>
            {error ? (
              <Typography variant="h6" color="error">Error: {error.message || "Failed to load data."}</Typography>
            ) : (
              <Typography variant="h6">Loading calendar data...</Typography>
            )}
          </Box>
        ) : (
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