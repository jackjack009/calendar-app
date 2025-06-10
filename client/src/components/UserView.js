import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  IconButton,
  Paper,
} from '@mui/material';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import axios from 'axios';
import Calendar from './Calendar';

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

// Simple Flappy Game Component
function FlappyGame() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState('Nhấn Space để bắt đầu!');
  const requestRef = useRef();
  const gameState = useRef({});

  // Game constants
  const width = 320;
  const height = 400;
  const gravity = 0.5;
  const jump = -7;
  const pipeWidth = 40;
  const pipeGap = 100;
  const birdSize = 20;

  // Start or restart the game
  const startGame = () => {
    setScore(0);
    setIsRunning(true);
    setMessage('');
    gameState.current = {
      birdY: height / 2,
      birdV: 0,
      pipes: [
        { x: width, top: Math.random() * (height - pipeGap - 60) + 30 },
      ],
      frame: 0,
      alive: true,
    };
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  // Main game loop
  const gameLoop = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    let { birdY, birdV, pipes, frame, alive } = gameState.current;

    // Draw bird
    ctx.fillStyle = '#1976d2';
    ctx.fillRect(50, birdY, birdSize, birdSize);

    // Bird physics
    birdV += gravity;
    birdY += birdV;

    // Draw pipes and move them
    ctx.fillStyle = '#43a047';
    for (let i = 0; i < pipes.length; i++) {
      const p = pipes[i];
      ctx.fillRect(p.x, 0, pipeWidth, p.top);
      ctx.fillRect(p.x, p.top + pipeGap, pipeWidth, height - p.top - pipeGap);
      p.x -= 2;
      // Collision
      if (
        50 + birdSize > p.x &&
        50 < p.x + pipeWidth &&
        (birdY < p.top || birdY + birdSize > p.top + pipeGap)
      ) {
        alive = false;
      }
      // Score
      if (p.x + pipeWidth === 50) {
        setScore((s) => s + 1);
      }
    }
    // Remove off-screen pipes
    if (pipes.length && pipes[0].x < -pipeWidth) pipes.shift();
    // Add new pipes
    if (frame % 90 === 0) {
      pipes.push({ x: width, top: Math.random() * (height - pipeGap - 60) + 30 });
    }
    // Ground/ceiling collision
    if (birdY < 0 || birdY + birdSize > height) alive = false;
    // Update state
    gameState.current = { birdY, birdV, pipes, frame: frame + 1, alive };
    // Draw score
    ctx.fillStyle = '#000';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
    // Continue or end
    if (alive) {
      requestRef.current = requestAnimationFrame(gameLoop);
    } else {
      setIsRunning(false);
      setMessage('Game Over! Nhấn Space để chơi lại.');
    }
  };

  // Handle spacebar
  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === 'Space') {
        if (!isRunning) {
          startGame();
        } else {
          gameState.current.birdV = jump;
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line
  }, [isRunning]);

  // Clean up animation frame
  useEffect(() => {
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2, mb: 4 }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ border: '2px solid #1976d2', background: '#e3f2fd', borderRadius: 8 }}
      />
      <Typography variant="subtitle1" color="error" sx={{ mt: 1 }}>
        {message}
      </Typography>
      <Typography variant="subtitle2" sx={{ mt: 1 }}>
        Điểm: {score}
      </Typography>
    </Box>
  );
}

function UserView({ dateTitles, refreshDateTitles, isLoadingDateTitles }) {
  const [slots, setSlots] = useState([]);
  const [currentDate, setCurrentDate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // State to hold the generated Sundays from Calendar
  const [generatedSundays, setGeneratedSundays] = useState([]);

  const fetchSlots = async (dateString) => {
    const maxRetries = 5;
    const baseDelay = 1000; // 1 second

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.get(
          `${API_URL}/api/slots/week/${dateString}`
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
          return;
        }

        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  useEffect(() => {
    console.log('generatedSundays:', generatedSundays);
    console.log('currentDate:', currentDate);
    if (!currentDate && generatedSundays.length > 0) {
      setCurrentDate(generatedSundays[0]);
    }
    // Fallback: if generatedSundays is empty after 5 seconds, stop loading
    if (generatedSundays.length === 0) {
      const timeout = setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
          setError(new Error('No Sundays generated.'));
        }
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [currentDate, generatedSundays]);

  useEffect(() => {
    console.log('currentDate changed:', currentDate);
    if (currentDate) {
      fetchSlots(currentDate);
    }
  }, [currentDate]);

  const handleDateSelect = (dateKey) => {
    setCurrentDate(dateKey);
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

  // Helper to check if previous week is allowed
  const isPreviousWeekDisabled = new Date(currentDate) <= getNextSunday(new Date());

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Button variant="contained" onClick={() => navigate('/')}>Home</Button>
        <Button variant="contained" onClick={() => navigate('/login')}>Admin</Button>
      </Box>

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
          onDateTitleUpdate={refreshDateTitles}
          onDateSelect={handleDateSelect}
          selectedDate={currentDate}
          onSundaysGenerated={setGeneratedSundays}
        />
      )}

      <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          {isLoading || error ?
            "Lịch chưa load xong? Nhún nhún con chim tí rồi đợi nó refresh lại nha" :
            "Bực mình vì mất slot? Nhún chim đi cho nó bực thêm"}
        </Typography>
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Box sx={{ width: { xs: '100%', sm: '400px' }, maxWidth: '100%', aspectRatio: '3/4', boxShadow: 3, borderRadius: 2, overflow: 'hidden' }}>
            <iframe
              src="https://flappybird.io/"
              title="Flappy Bird"
              width="100%"
              height="500"
              style={{ border: 'none', display: 'block', width: '100%' }}
              allow="autoplay; fullscreen"
            />
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default UserView;
