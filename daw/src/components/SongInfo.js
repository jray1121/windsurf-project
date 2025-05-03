import React from 'react';
import { Box, Typography } from '@mui/material';

const SongInfo = ({ title, composers = [], lyricists = [], arrangers = [] }) => {
  // Join arrays into comma-separated strings
  const composer = composers.join(', ');
  const lyricist = lyricists.join(', ');
  const arranger = arrangers.join(', ');

  // Count how many credits we have to determine layout
  const creditCount = [composer, lyricist, arranger].filter(Boolean).length;

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      mb: 3,
      mt: 1
    }}>
      {/* Title is always shown and prominent */}
      <Typography 
        variant="h4" 
        sx={{ 
          color: '#ffffff',
          textAlign: 'center',
          mb: creditCount > 0 ? 1 : 0,
          fontWeight: 500
        }}
      >
        {title}
      </Typography>

      {/* Credits section with dynamic layout */}
      {creditCount > 0 && (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {composer && (
            <Typography 
              sx={{ 
                color: '#999999',
                fontSize: '0.9rem',
                textAlign: 'center'
              }}
            >
              <Box component="span" sx={{ color: '#666666' }}>Composed by </Box>
              {composer}
            </Typography>
          )}

          {lyricist && (
            <Typography 
              sx={{ 
                color: '#999999',
                fontSize: '0.9rem',
                textAlign: 'center'
              }}
            >
              <Box component="span" sx={{ color: '#666666' }}>Lyrics by </Box>
              {lyricist}
            </Typography>
          )}

          {arranger && (
            <Typography 
              sx={{ 
                color: '#999999',
                fontSize: '0.9rem',
                textAlign: 'center'
              }}
            >
              <Box component="span" sx={{ color: '#666666' }}>Arranged by </Box>
              {arranger}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default SongInfo;
