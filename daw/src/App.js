import React, { useState, useEffect } from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import DAW from './components/DAW';
import { getSongs } from './services/api';

// Create a theme instance
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#873995',
      light: '#a561b3',
      dark: '#6a2c74',
      contrastText: '#fff',
    },
    background: {
      default: '#000000',
      paper: '#000000',
    },
  },
});

function App() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSongs = async () => {
      try {
        const data = await getSongs();
        setSongs(data);
      } catch (error) {
        console.error('Failed to load songs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSongs();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DAW songs={songs} loading={loading} />
    </ThemeProvider>
  );
}

export default App;
