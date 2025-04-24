import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  LinearProgress,
  TextField,
  Stack
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';

const AudioFileUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [songName, setSongName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('audio/')) {
      setSelectedFile(file);
      // Use the file name (without extension) as default song name
      setSongName(file.name.replace(/\.[^/.]+$/, ""));
    } else {
      alert('Please select an audio file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !songName.trim()) {
      alert('Please select a file and provide a song name');
      return;
    }

    setUploading(true);
    
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', songName);

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
      setSongName('');
      setUploadProgress(0);
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
                disabled={uploading}
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

          <TextField
            label="Song Name"
            value={songName}
            onChange={(e) => setSongName(e.target.value)}
            disabled={uploading}
            fullWidth
          />

          <Box>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              fullWidth
            >
              Upload
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
