import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  LinearProgress,
  TextField,
  Stack,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';

const TRACK_TYPES = [
  // Core tracks
  { id: 'click', label: 'Click Track', core: true },
  { id: 'piano', label: 'Piano Track', core: true },
  { id: 'all_vocals', label: 'All Vocals', core: true },
  // Voice parts
  { id: 'soprano', label: 'Soprano' },
  { id: 'soprano_1', label: 'Soprano 1' },
  { id: 'soprano_2', label: 'Soprano 2' },
  { id: 'alto', label: 'Alto' },
  { id: 'alto_1', label: 'Alto 1' },
  { id: 'alto_2', label: 'Alto 2' },
  { id: 'tenor', label: 'Tenor' },
  { id: 'tenor_1', label: 'Tenor 1' },
  { id: 'tenor_2', label: 'Tenor 2' },
  { id: 'baritone', label: 'Baritone' },
  { id: 'bass', label: 'Bass' },
  { id: 'bass_1', label: 'Bass 1' },
  { id: 'bass_2', label: 'Bass 2' },
  { id: 'part_1', label: 'Part I' },
  { id: 'part_2', label: 'Part II' },
  { id: 'part_3', label: 'Part III' },
];

const AudioFileUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [songTitle, setSongTitle] = useState('');
  const [trackType, setTrackType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('audio/')) {
      setSelectedFile(file);
    } else {
      alert('Please select an audio file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !songTitle.trim() || !trackType) {
      alert('Please select a file, provide a song title, and select a track type');
      return;
    }

    setUploading(true);
    
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('songTitle', songTitle);
      formData.append('trackType', trackType);

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 500);

      // TODO: Replace with actual API call
      // const response = await uploadSong(formData);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Simulate API call

      clearInterval(interval);
      setUploadProgress(100);
      alert('Upload successful!');

      // Reset form
      setSelectedFile(null);
      setTrackType('');
      setUploadProgress(0);
      // Keep the song title for additional uploads
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Upload New Song
        </Typography>
        
        <Stack spacing={3}>
          <TextField
            label="Song Title"
            value={songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
            disabled={uploading}
            fullWidth
            required
          />

          <FormControl fullWidth required>
            <InputLabel>Track Type</InputLabel>
            <Select
              value={trackType}
              onChange={(e) => setTrackType(e.target.value)}
              disabled={uploading}
            >
              <MenuItem disabled value="">
                <em>Select a track type</em>
              </MenuItem>
              
              {/* Core tracks */}
              {TRACK_TYPES.filter(t => t.core).map((track) => (
                <MenuItem key={track.id} value={track.id}>
                  {track.label}
                </MenuItem>
              ))}
              
              <Divider sx={{ my: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Voice Parts
                </Typography>
              </Divider>
              
              {/* Voice part tracks */}
              {TRACK_TYPES.filter(t => !t.core).map((track) => (
                <MenuItem key={track.id} value={track.id}>
                  {track.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box>
            <input
              accept="audio/*"
              style={{ display: 'none' }}
              id="audio-file-input"
              type="file"
              onChange={handleFileSelect}
            />
            <label htmlFor="audio-file-input">
              <Button
                variant="contained"
                component="span"
                startIcon={<CloudUploadIcon />}
                disabled={uploading || !songTitle.trim()}
                fullWidth
              >
                Select Audio File
              </Button>
            </label>
            {selectedFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected: {selectedFile.name}
              </Typography>
            )}
          </Box>

          <Box>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              disabled={!selectedFile || !songTitle.trim() || !trackType || uploading}
              fullWidth
            >
              Upload Track
            </Button>
            
            {uploading && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress variant="determinate" value={uploadProgress} />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Uploading... {uploadProgress}%
                </Typography>
              </Box>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default AudioFileUpload;
