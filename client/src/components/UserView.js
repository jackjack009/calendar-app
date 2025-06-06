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

function UserView() {
  const [slots, setSlots] = useState([]);
  const [currentDate, setCurrentDate] = useState(getNextSunday());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchSlots = async (date) => {
    try {
      setIsLoading(true);
      setError(null);
      const sunday = getNextSunday(date);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/slots/week/${sunday.toISOString()}`
      );
      setSlots(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching slots:', error);
      setError(error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots(currentDate);
  }, [currentDate]);

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

  // Helper to check if previous week is allowed
  const isPreviousWeekDisabled = currentDate <= getNextSunday(new Date());

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Button variant="contained" onClick={() => navigate('/')}>Home</Button>
        <Button variant="contained" onClick={() => navigate('/login')}>Admin</Button>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handlePreviousWeek} disabled={isPreviousWeekDisabled}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" align="center">
          {formatDate(currentDate)}
        </Typography>
        <IconButton onClick={handleNextWeek}>
          <ArrowForward />
        </IconButton>
      </Box>

      <Calendar slots={slots} currentDate={currentDate} />

      <Paper elevation={3} sx={{ p: 3, mt: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          {isLoading || error ? 
            "Lịch chưa load xong? Nhún nhún con chim tí rồi đợi nó refresh lại nha" : 
            "Bực mình vì mất slot? Nhún chim đi cho nó bực thêm"}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2, mb: 4 }}>
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
        </Box>
      </Paper>
    </Container>
  );
}

export default UserView; 
