import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
  TextField,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import axios from 'axios';
import { formatDateToYYYYMMDD, createLocalDateFromYYYYMMDD, getSundayOfWeek } from '../utils/dateUtils';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Calendar({ slots, onSlotClick, isAdmin, dateTitles, onDateTitleUpdate, onDateSelect, selectedDate, onSundaysGenerated }) {
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [editingDate, setEditingDate] = useState(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [deletedDates, setDeletedDates] = useState([]);

  const getNearestSunday = (date) => {
    const result = new Date(date);
    result.setDate(date.getDate() + (0 + 7 - date.getDay()) % 7);
    return result;
  };

  const generateSundays = () => {
    const today = new Date();
    // Find the nearest upcoming Sunday using the utility function
    const nearestSunday = getSundayOfWeek(today);
    const sundays = [];
    for (let i = 0; i < 20; i++) {
      const nextSunday = new Date(nearestSunday);
      nextSunday.setDate(nearestSunday.getDate() + (i * 7));
      sundays.push(formatDateToYYYYMMDD(nextSunday));
    }
    return sundays;
  };

  const sundayDates = generateSundays();

  useEffect(() => {
    console.log('Calendar: calling onSundaysGenerated with', sundayDates);
    if (onSundaysGenerated) {
      onSundaysGenerated(sundayDates);
    }
  }, [sundayDates, onSundaysGenerated]);

  useEffect(() => {
    const fetchDeletedDates = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/deleted-dates`);
        setDeletedDates(response.data);
      } catch (error) {
        console.error('Error fetching deleted dates:', error);
      }
    };

    fetchDeletedDates();
  }, []);

  const getColumns = () => {
    if (isLargeScreen) return 4;
    return 2;
  };

  const formatTime = (hour, slotNumber) => {
    const minutes = slotNumber * 15;
    return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    // Ensure the date string is parsed as a local date to avoid timezone issues
    const date = createLocalDateFromYYYYMMDD(dateString); 
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    const date = new Date(slot.date);
    const dateKey = date.toISOString().split('T')[0];
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(slot);
    return acc;
  }, {});

  // Debug log for slots and selectedDate
  console.log('Calendar: slots prop', slots);
  console.log('Calendar: selectedDate', selectedDate);
  console.log('Calendar: slotsByDate', slotsByDate);

  // Sort dates (now using generated Sunday dates)
  const sortedDates = sundayDates;

  const handleDateClick = (dateKey) => {
    if (onDateSelect) {
      onDateSelect(dateKey);
    }
  };

  const handleEditDateTitle = (dateKey) => {
    setEditingDate(dateKey);
    setEditedTitle(dateTitles[dateKey] || formatDate(new Date(dateKey)));
  };

  const handleSaveDateTitle = async (dateKey, newTitle) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/date-titles`,
        { date: dateKey, title: newTitle },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setEditingDate(null);
      setEditedTitle('');
      if (onDateTitleUpdate) {
        onDateTitleUpdate();
      }
    } catch (error) {
      console.error('Error saving date title:', error);
      // Optionally, show an error message to the user
    }
  };

  const handleCancelEdit = () => {
    setEditingDate(null);
    setEditedTitle('');
  };

  const handleDeleteDate = async (dateKey) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/deleted-dates`,
        { date: dateKey },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setDeletedDates(prev => [...prev, dateKey]);
      if (selectedDate === dateKey) {
        handleDateClick(null);
      }
      if (onDateTitleUpdate) {
        onDateTitleUpdate(); // Notify parent to re-fetch dates (though parent handles slots, not deleted dates)
      }
    } catch (error) {
      console.error('Error deleting date:', error);
    }
  };

  const handleAddBackDate = async (dateKey) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_URL}/api/deleted-dates/${dateKey}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setDeletedDates(prev => prev.filter(date => date !== dateKey));
      handleDateClick(dateKey);
      if (onDateTitleUpdate) {
        onDateTitleUpdate(); // Notify parent to re-fetch dates
      }
    } catch (error) {
      console.error('Error adding back date:', error);
    }
  };

  const displayedDates = sortedDates.filter(dateKey => !deletedDates.includes(dateKey));

  return (
    <Grid container spacing={2}>
      {/* Date Selection Column / Dropdown */}
      <Grid item xs={12} md={3}>
        {isMobile ? (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="sunday-select-label">Select Sunday</InputLabel>
            <Select
              labelId="sunday-select-label"
              value={selectedDate || ''}
              label="Select Sunday"
              onChange={(e) => handleDateClick(e.target.value)}
            >
              {displayedDates.map((dateKey) => (
                <MenuItem key={dateKey} value={dateKey}>
                  {dateTitles[dateKey] || formatDate(new Date(dateKey))}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Chọn lịch Fes
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {displayedDates.map((dateKey) => (
                <Paper
                  key={dateKey}
                  elevation={1}
                  sx={{
                    p: 1,
                    cursor: 'pointer',
                    bgcolor: selectedDate === dateKey ? '#e3f2fd' : 'white',
                    '&:hover': {
                      bgcolor: '#e3f2fd',
                    },
                  }}
                  onClick={() => handleDateClick(dateKey)}
                >
                  {editingDate === dateKey ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TextField
                        size="small"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveDateTitle(dateKey, editedTitle);
                          }
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleSaveDateTitle(dateKey, editedTitle)}
                      >
                        <CheckIcon />
                      </IconButton>
                      <IconButton size="small" onClick={handleCancelEdit}>
                        <CloseIcon />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography>
                        {dateTitles[dateKey] || formatDate(new Date(dateKey))}
                      </Typography>
                      {isAdmin && (
                        <Box>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditDateTitle(dateKey);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDate(dateKey);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                  )}
                </Paper>
              ))}
              {isAdmin && deletedDates.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>Deleted Dates</Typography>
                  {deletedDates.map((dateKey) => (
                    <Paper
                      key={dateKey}
                      elevation={1}
                      sx={{
                        p: 1,
                        bgcolor: '#f5f5f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mt: 1,
                      }}
                    >
                      <Typography sx={{ textDecoration: 'line-through' }}>
                        {dateTitles[dateKey] || formatDate(new Date(dateKey))}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddBackDate(dateKey);
                        }}
                      >
                        <AddCircleIcon fontSize="small" />
                      </IconButton>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          </Paper>
        )}
      </Grid>

      {/* Slots Grid */}
      <Grid item xs={12} md={9}>
        {selectedDate && slotsByDate[selectedDate] && slotsByDate[selectedDate].length > 0 ? (
          <Grid container spacing={2}>
            {slotsByDate[selectedDate].map((slot) => (
              <Grid item xs={6} sm={6} md={4} lg={3} key={slot._id}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 2,
                    cursor: isAdmin ? 'pointer' : 'default',
                    bgcolor: slot.isAvailable ? '#e8f5e9' : '#ffebee',
                    '&:hover': {
                      bgcolor: isAdmin
                        ? slot.isAvailable
                          ? '#c8e6c9'
                          : '#ffcdd2'
                        : undefined,
                    },
                  }}
                  onClick={() => isAdmin && onSlotClick(slot)}
                >
                  <Typography variant="h6" align="center">
                    {formatTime(slot.hour, slot.slotNumber)}
                  </Typography>
                  <Typography
                    variant="body2"
                    align="center"
                    color={slot.isAvailable ? 'success.main' : 'error.main'}
                  >
                    {slot.isAvailable ? 'Available' : 'Unavailable'}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : selectedDate ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">No slots available for this Sunday.</Typography>
            {isAdmin && (
              <Typography variant="body2" color="textSecondary">
                (Slots will be auto-generated by the backend when this Sunday is requested for the first time.)
              </Typography>
            )}
          </Box>
        ) : (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Please select a Sunday from the list.</Typography>
          </Box>
        )}
      </Grid>
    </Grid>
  );
}

export default Calendar; 