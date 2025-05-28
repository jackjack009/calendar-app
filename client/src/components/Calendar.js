import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';

function Calendar({ slots, onSlotClick, isAdmin }) {
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  const isMediumScreen = useMediaQuery(theme.breakpoints.up('md'));

  const getColumns = () => {
    if (isLargeScreen) return 4;
    if (isMediumScreen) return 3;
    return 2;
  };

  const formatTime = (hour, slotNumber) => {
    const minutes = slotNumber * 15;
    return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <Grid container spacing={2}>
      {slots.map((slot) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={slot._id}>
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
  );
}

export default Calendar; 