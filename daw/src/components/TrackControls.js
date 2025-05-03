import React from 'react';
import { Box, IconButton, Slider, Typography } from '@mui/material';
import { formatTrackName } from './TrackTimeline';
import VolumeDown from '@mui/icons-material/VolumeDown';
import { styled } from '@mui/material/styles';

// Custom styled pan slider
const PanSlider = styled(Slider)({
  '& .MuiSlider-mark': {
    width: 2,
    height: 8,
    backgroundColor: '#666',
  },
  '& .MuiSlider-markActive': {
    backgroundColor: 'currentColor',
  },
  width: 60,
  padding: '10px 0',
  '& .MuiSlider-rail': {
    opacity: 0.3,
    height: 3
  },
  '& .MuiSlider-track': {
    height: 3,
    border: 'none'
  },
  '& .MuiSlider-thumb': {
    width: 12,
    height: 12,
    '&:before': {
      boxShadow: '0 2px 12px 0 rgba(0,0,0,0.4)'
    }
  }
});

// Track type to color mapping
const VOICE_TRACKS = ['tenor_1', 'tenor_2', 'bass_1'];

const trackColors = {
  click: '#666666',
  piano: '#4A90E2',
  all_vocals: '#D35400',
  tenor_1: '#27AE60',
  tenor_2: '#8E44AD',
  bass_1: '#C0392B'
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
        justifyContent: 'space-between',
        mb: 1
      }}>
        <Typography 
          sx={{ 
            color: '#ffffff',
            fontSize: '0.9rem',
            fontWeight: 500,
            flexGrow: 1
          }}
        >
          {formatTrackName(track.type)}
        </Typography>

        {/* Right side controls container */}
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          width: 50  // Width of the pan buttons
        }}>
          {/* Mute/Solo Buttons */}
          <Box sx={{ 
            display: 'flex', 
            gap: 0.25,
            flexShrink: 0,
            ml: 0.5
          }}>
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
          </Box>
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

        {/* Pan Control - only for voice tracks */}
        {VOICE_TRACKS.includes(track.type) && (
          <Box sx={{ 
            display: 'flex', 
            flexShrink: 0,
            border: '1px solid #444444',
            borderRadius: 1,
            overflow: 'hidden'
          }}>
            <IconButton
              size="small"
              onClick={() => onPanChange(-1)}
              sx={{
                width: 14,
                height: 14,
                minWidth: 14,
                color: pan === -1 ? trackColor : '#666666',
                backgroundColor: pan === -1 ? `${trackColor}22` : '#333333',
                '&:hover': {
                  backgroundColor: pan === -1 ? `${trackColor}33` : '#444444',
                },
                borderRadius: 0,
                fontSize: '0.65rem',
                p: 0
              }}
            >
              L
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onPanChange(0)}
              sx={{
                width: 14,
                height: 14,
                minWidth: 14,
                color: pan === 0 ? trackColor : '#666666',
                backgroundColor: pan === 0 ? `${trackColor}22` : '#333333',
                '&:hover': {
                  backgroundColor: pan === 0 ? `${trackColor}33` : '#444444',
                },
                borderRadius: 0,
                borderLeft: '1px solid #444444',
                borderRight: '1px solid #444444',
                fontSize: '0.65rem',
                p: 0
              }}
            >
              C
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onPanChange(1)}
              sx={{
                width: 14,
                height: 14,
                minWidth: 14,
                color: pan === 1 ? trackColor : '#666666',
                backgroundColor: pan === 1 ? `${trackColor}22` : '#333333',
                '&:hover': {
                  backgroundColor: pan === 1 ? `${trackColor}33` : '#444444',
                },
                borderRadius: 0,
                fontSize: '0.65rem',
                p: 0
              }}
            >
              R
            </IconButton>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TrackControls;
