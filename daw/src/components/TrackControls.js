import React from 'react';
import { Box, IconButton, Slider, Typography } from '@mui/material';
import { formatTrackName } from './TrackTimeline';
import VolumeDown from '@mui/icons-material/VolumeDown';
import { styled } from '@mui/material/styles';

// Custom styled circular pan knob
const PanSlider = styled(Slider)({
  width: 60,
  '& .MuiSlider-thumb': {
    width: 12,
    height: 12,
  },
  '& .MuiSlider-rail': {
    opacity: 0.3
  }
});

// Track type to color mapping
const trackColors = {
  click: '#666666',
  piano: '#4A90E2',
  all_vocals: '#D35400',
  tenor_1: '#27AE60',
  tenor_2: '#8E44AD',
  bass: '#C0392B'
};

const TrackControls = ({ 
  track, 
  isMuted, 
  isSoloed, 
  volume = 1, 
  pan = 0, 
  onMute, 
  onSolo, 
  onVolumeChange, 
  onPanChange 
}) => {
  const trackColor = trackColors[track.type] || '#666666';

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      p: 1,
      backgroundColor: '#1a1a1a',
      borderLeft: `3px solid ${trackColor}`,
      height: '100%'
    }}>
      {/* Track Name and Controls */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        mb: 1
      }}>
        <Typography 
          sx={{ 
            color: '#ffffff',
            fontSize: '0.9rem',
            fontWeight: 500,
            width: '80px',
            flexShrink: 0
          }}
        >
          {formatTrackName(track.type)}
        </Typography>

        {/* Mute/Solo Buttons */}
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          <IconButton
            size="small"
            onClick={onMute}
            sx={{
              width: 24,
              height: 24,
              color: isMuted ? '#ff4444' : '#ffffff',
              backgroundColor: isMuted ? '#440000' : '#333333',
              '&:hover': {
                backgroundColor: isMuted ? '#550000' : '#444444',
              },
              fontSize: '0.75rem'
            }}
          >
            M
          </IconButton>
          <IconButton
            size="small"
            onClick={onSolo}
            sx={{
              width: 24,
              height: 24,
              color: isSoloed ? '#44ff44' : '#ffffff',
              backgroundColor: isSoloed ? '#004400' : '#333333',
              '&:hover': {
                backgroundColor: isSoloed ? '#005500' : '#444444',
              },
              fontSize: '0.75rem'
            }}
          >
            S
          </IconButton>
        </Box>
      </Box>

      {/* Volume and Pan Controls */}
      <Box sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2
      }}>
        {/* Volume Slider */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 1,
          width: '120px'
        }}>
          <VolumeDown sx={{ color: '#666', fontSize: '1rem' }} />
          <Slider
            size="small"
            value={volume * 100}
            onChange={(e, newValue) => onVolumeChange(newValue / 100)}
            sx={{
              color: trackColor,
              '& .MuiSlider-thumb': {
                width: 12,
                height: 12,
                '&:hover, &.Mui-focusVisible': {
                  boxShadow: `0 0 0 8px ${trackColor}22`
                }
              },
              '& .MuiSlider-rail': {
                opacity: 0.3
              }
            }}
          />
        </Box>

        {/* Pan Control */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 0.5,
          width: '60px'
        }}>
          <Typography sx={{ color: '#666', fontSize: '0.75rem', mr: 0.5 }}>
            L
          </Typography>
          <PanSlider
            size="small"
            min={-1}
            max={1}
            step={0.01}
            value={pan}
            onChange={(e, newValue) => onPanChange(newValue)}
            sx={{ color: trackColor }}
          />
          <Typography sx={{ color: '#666', fontSize: '0.75rem', ml: 0.5 }}>
            R
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default TrackControls;
