import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

const WaveformDisplay = ({ 
  audioBuffer,
  width,
  height,
  zoomLevel,
  color = '#4a148c' // Default to a darker purple
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!audioBuffer || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set up scaling
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    
    // Style settings
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    
    // Get the audio data
    const channelData = audioBuffer.getChannelData(0); // Use first channel
    const step = Math.ceil(channelData.length / (width * zoomLevel));
    const amp = height / 2;
    
    // Start drawing
    ctx.beginPath();
    ctx.moveTo(0, amp);
    
    // Draw the waveform
    for (let i = 0; i < width * zoomLevel; i++) {
      const startIdx = Math.floor(i * step);
      const endIdx = Math.floor((i + 1) * step);
      
      // Find min and max values in this segment
      let min = 1.0;
      let max = -1.0;
      
      for (let j = startIdx; j < endIdx && j < channelData.length; j++) {
        const value = channelData[j];
        if (value < min) min = value;
        if (value > max) max = value;
      }
      
      // Draw vertical line from min to max
      const x = i / zoomLevel;
      ctx.moveTo(x, (1 + min) * amp);
      ctx.lineTo(x, (1 + max) * amp);
    }
    
    ctx.stroke();
  }, [audioBuffer, width, height, zoomLevel, color]);

  return (
    <Box 
      sx={{ 
        width: width,
        height: height,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '4px',
        overflow: 'hidden'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%'
        }}
      />
    </Box>
  );
};

export default WaveformDisplay;
