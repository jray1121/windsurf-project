import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import WaveSurfer from 'wavesurfer.js';

const Track = ({
  url,
  name,
  zoom = 100,
  onReady,
  onPositionChange,
  isPlaying,
}) => {
  const containerRef = useRef(null);
  const wavesurferRef = useRef(null);
  const [error, setError] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!url || !containerRef.current) return;

    setLoading(true);
    setError(null);

    const initWaveSurfer = async () => {
      try {
        console.log('Initializing WaveSurfer with URL:', url);
        
        // Create WaveSurfer instance
        const wavesurfer = WaveSurfer.create({
          container: containerRef.current,
          waveColor: '#567',
          progressColor: '#89a',
          cursorColor: '#fff',
          barWidth: 2,
          barGap: 1,
          height: 80,
          normalize: true,
          minPxPerSec: zoom,
          mediaControls: false,
          interact: false,
          xhr: {
            // Add CORS headers
            requestHeaders: [
              {
                key: 'Access-Control-Allow-Origin',
                value: '*'
              }
            ]
          }
        });

        // Save to ref
        wavesurferRef.current = wavesurfer;

        // Event handlers
        wavesurfer.on('ready', () => {
          console.log('WaveSurfer ready');
          setLoading(false);
          if (onReady) onReady(wavesurfer);
        });

        wavesurfer.on('timeupdate', (currentTime) => {
          if (onPositionChange) onPositionChange(currentTime);
        });

        wavesurfer.on('error', (err) => {
          console.error('WaveSurfer error:', err);
          setError('Error loading audio file');
          setLoading(false);
        });

        // Load audio file
        console.log('Loading audio file...');
        await wavesurfer.load(url);
        console.log('WaveSurfer loaded audio');

      } catch (err) {
        console.error('Error initializing WaveSurfer:', err);
        setError('Failed to initialize audio');
        setLoading(false);
      }
    };

    initWaveSurfer();

    // Cleanup
    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
    };
  }, [url, zoom, onReady, onPositionChange]);

  // Handle play/pause
  useEffect(() => {
    if (wavesurferRef.current) {
      if (isPlaying) {
        wavesurferRef.current.play();
      } else {
        wavesurferRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Handle zoom changes
  useEffect(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.zoom(zoom);
    }
  }, [zoom]);

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 1,
        p: 1,
        mb: 1,
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {name}
      </Typography>
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
      {error && (
        <Typography color="error" variant="caption">
          {error}
        </Typography>
      )}
      <Box
        ref={containerRef}
        sx={{
          visibility: loading ? 'hidden' : 'visible',
          height: loading ? 0 : 'auto',
        }}
      />
    </Box>
  );
};

export default Track;
