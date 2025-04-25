const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 8080;

// Enable CORS for the React app
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Store songs in memory for now (replace with database later)
let songs = [];

// Routes
app.post('/api/tracks/upload', upload.single('file'), (req, res) => {
  try {
    const { title, voicing, timeSignature, noteValue } = req.body;
    const file = req.file;

    const song = {
      id: Date.now().toString(),
      title: title || 'Untitled',
      voicing: voicing || 'unknown',
      timeSignature,
      noteValue,
      tracks: [{
        id: Date.now().toString(),
        name: file.filename,
        originalName: file.originalname,
        url: `/uploads/${file.filename}`,
        uploadDate: new Date()
      }]
    };

    songs.push(song);
    res.json(song);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.get('/api/songs', (req, res) => {
  res.json(songs);
});

app.delete('/api/songs/:id', (req, res) => {
  const songId = req.params.id;
  songs = songs.filter(song => song.id !== songId);
  res.json({ message: 'Song deleted' });
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

app.listen(port, () => {
  console.log(`API server running on port ${port}`);
});
