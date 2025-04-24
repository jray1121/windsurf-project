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
  Divider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Paper
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';

const CORE_TRACKS = [
  { id: 'click', label: 'Click Track' },
  { id: 'piano', label: 'Piano Track' },
  { id: 'all_vocals', label: 'All Vocals' }
];

const VOICE_PARTS = [
  // Soprano section
  { id: 'soprano', label: 'Soprano' },
  { id: 'soprano_1', label: 'Soprano 1' },
  { id: 'soprano_2', label: 'Soprano 2' },
  // Alto section
  { id: 'alto', label: 'Alto' },
  { id: 'alto_1', label: 'Alto 1' },
  { id: 'alto_2', label: 'Alto 2' },
  // Tenor section
  { id: 'tenor', label: 'Tenor' },
  { id: 'tenor_1', label: 'Tenor 1' },
  { id: 'tenor_2', label: 'Tenor 2' },
  // Bass section
  { id: 'baritone', label: 'Baritone' },
  { id: 'bass', label: 'Bass' },
  { id: 'bass_1', label: 'Bass 1' },
  { id: 'bass_2', label: 'Bass 2' },
  // Parts
  { id: 'part_1', label: 'Part I' },
  { id: 'part_2', label: 'Part II' },
  { id: 'part_3', label: 'Part III' }
];

const AudioFileUpload = () => {
  const [songTitle, setSongTitle] = useState('');
  const [selectedVoiceParts, setSelectedVoiceParts] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [completedTracks, setCompletedTracks] = useState([]);

  // Group voice parts by section
  const voicePartSections = {
    Soprano: VOICE_PARTS.filter(part => part.id.startsWith('soprano')),
    Alto: VOICE_PARTS.filter(part => part.id.startsWith('alto')),
    Tenor: VOICE_PARTS.filter(part => part.id.startsWith('tenor')),
    Bass: VOICE_PARTS.filter(part => 
      part.id.startsWith('bass') || part.id === 'baritone'
    ),
    Parts: VOICE_PARTS.filter(part => part.id.startsWith('part'))
  };

  const handleFileSelect = (trackId) => (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('audio/')) {
      setCurrentTrack({ id: trackId, file });
    } else {
      alert('Please select an audio file');
    }
  };

  const handleUpload = async () => {
    if (!currentTrack?.file || !songTitle.trim()) {
      alert('Please select a file and provide a song title');
      return;
    }

    setUploading(true);
    
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', currentTrack.file);
      formData.append('songTitle', songTitle);
      formData.append('trackType', currentTrack.id);

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

      // Add to completed tracks and reset current
      setCompletedTracks([...completedTracks, currentTrack.id]);
      setCurrentTrack(null);
      setUploadProgress(0);
      // Keep the song title and selected voice parts for additional uploads
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

          {/* Core Tracks Section */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Required Tracks
            </Typography>
            <Stack spacing={2}>
              {CORE_TRACKS.map((track) => {
                const isCompleted = completedTracks.includes(track.id);
                const isCurrentTrack = currentTrack?.id === track.id;

                return (
                  <Box key={track.id}>
                    <input
                      accept="audio/*"
                      style={{ display: 'none' }}
                      id={`audio-file-${track.id}`}
                      type="file"
                      onChange={handleFileSelect(track.id)}
                      disabled={isCompleted || uploading}
                    />
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography
                        variant="body1"
                        sx={{
                          flex: 1,
                          color: isCompleted ? 'success.main' : 'text.primary'
                        }}
                      >
                        {track.label}
                        {isCompleted && ' ✓'}
                      </Typography>
                      <label htmlFor={`audio-file-${track.id}`}>
                        <Button
                          variant={isCompleted ? "outlined" : "contained"}
                          component="span"
                          startIcon={<CloudUploadIcon />}
                          disabled={uploading || isCompleted}
                          size="small"
                        >
                          {isCompleted ? 'Uploaded' : 'Upload'}
                        </Button>
                      </label>
                    </Stack>
                    {isCurrentTrack && (
                      <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                        Selected: {currentTrack.file.name}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Stack>
          </Paper>

          {/* Voice Parts Selection */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Voice Parts to Include
            </Typography>
            <Stack spacing={2}>
              {Object.entries(voicePartSections).map(([section, parts]) => (
                <Box key={section}>
                  <Typography variant="subtitle1" color="primary" gutterBottom>
                    {section}
                  </Typography>
                  <FormGroup>
                    {parts.map((part) => (
                      <FormControlLabel
                        key={part.id}
                        control={
                          <Checkbox
                            checked={selectedVoiceParts.includes(part.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedVoiceParts([...selectedVoiceParts, part.id]);
                              } else {
                                setSelectedVoiceParts(
                                  selectedVoiceParts.filter(id => id !== part.id)
                                );
                              }
                            }}
                          />
                        }
                        label={part.label}
                      />
                    ))}
                  </FormGroup>
                </Box>
              ))}
            </Stack>
          </Paper>

          {currentTrack && (
            <Box>
              <Button
                variant="contained"
                color="primary"
                onClick={handleUpload}
                disabled={!currentTrack || !songTitle.trim() || uploading}
                fullWidth
              >
                Upload {currentTrack.id === 'click' ? 'Click Track' :
                       currentTrack.id === 'piano' ? 'Piano Track' :
                       currentTrack.id === 'all_vocals' ? 'All Vocals' : ''}
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
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default AudioFileUpload;
