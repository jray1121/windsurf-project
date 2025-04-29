import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 8080;

// Configure CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Range'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length']
}));

app.use(express.json());

// Serve static files from uploads directory with CORS
app.use('/uploads', (req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uuid = uuidv4();
    // Store the mapping between UUID and original filename
    fileMapping[uuid] = {
      originalName: file.originalname,
      uuid: uuid,
      ext: ext
    };
    cb(null, `${uuid}${ext}`);
  },
});

// Keep track of original filenames
const fileMapping = {};

const upload = multer({ storage });

// File-based storage for songs and tracks
const dataFile = path.join(__dirname, '../data/songs.json');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load existing songs from file
let songs = [];
if (fs.existsSync(dataFile)) {
  try {
    const data = fs.readFileSync(dataFile, 'utf8');
    songs = JSON.parse(data);
    console.log('Loaded songs from file:', songs.length);
  } catch (error) {
    console.error('Error loading songs from file:', error);
  }
}

// Save songs to file
const saveSongs = () => {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(songs, null, 2));
    console.log('Saved songs to file');
  } catch (error) {
    console.error('Error saving songs to file:', error);
  }
};

// Routes
app.get('/api/songs', (req, res) => {
  res.json(songs);
});

app.post('/api/tracks/upload', upload.single('file'), (req, res) => {
  console.log('Received track upload request:', {
    body: req.body,
    file: req.file ? {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : null
  });

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { songTitle, voicing, trackType, timeSignature, beatValue } = req.body;
  console.log('Processing track:', { songTitle, voicing, trackType, timeSignature, beatValue });

  const trackId = uuidv4();
  const fileUuid = path.basename(req.file.path, path.extname(req.file.path));
  const filePath = `/uploads/${path.basename(req.file.path)}`;

  let song = songs.find(s => s.title === songTitle);
  console.log('Found existing song:', song ? { id: song.id, title: song.title, trackCount: song.tracks.length } : 'none');

  if (!song) {
    song = {
      id: uuidv4(),
      title: songTitle,
      voicing,
      timeSignature,
      beatValue,
      composers: req.body.composers ? JSON.parse(req.body.composers) : [],
      lyricists: req.body.lyricists ? JSON.parse(req.body.lyricists) : [],
      arrangers: req.body.arrangers ? JSON.parse(req.body.arrangers) : [],
      tracks: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    songs.push(song);
    console.log('Created new song:', { id: song.id, title: song.title });
  } else {
    // Update song metadata if provided
    if (timeSignature) song.timeSignature = timeSignature;
    if (beatValue) song.beatValue = beatValue;
    if (req.body.composers) song.composers = JSON.parse(req.body.composers);
    if (req.body.lyricists) song.lyricists = JSON.parse(req.body.lyricists);
    if (req.body.arrangers) song.arrangers = JSON.parse(req.body.arrangers);
    
    // Only remove existing track if it's a core track (allow multiple voice parts)
    if (trackType === 'click' || trackType === 'piano' || trackType === 'all_vocals') {
      const removedTracks = song.tracks.filter(t => t.type === trackType);
      song.tracks = song.tracks.filter(t => t.type !== trackType);
      console.log('Updated existing song:', { 
        id: song.id, 
        title: song.title, 
        removedTracks: removedTracks.map(t => ({ id: t.id, type: t.type })),
        remainingTracks: song.tracks.map(t => ({ id: t.id, type: t.type }))
      });
    }
    song.updatedAt = new Date();
  }

  song.tracks.push({
    id: trackId,
    type: trackType,
    filePath,
    originalName: fileMapping[fileUuid].originalName,
    timeSignature: timeSignature || '4/4',
    beatValue: beatValue || '1/4',
    uploadedAt: new Date()
  });

  // Save changes to file
  saveSongs();

  res.json({ songId: song.id, trackId });
});

app.delete('/api/songs/:songId', (req, res) => {
  const songIndex = songs.findIndex(s => s.id === req.params.songId);
  if (songIndex === -1) {
    return res.status(404).json({ error: 'Song not found' });
  }

  songs.splice(songIndex, 1);
  saveSongs();
  res.json({ message: 'Song deleted successfully' });
});

app.delete('/api/songs/:songId/tracks/:trackId', (req, res) => {
  const song = songs.find(s => s.id === req.params.songId);
  if (!song) {
    return res.status(404).json({ error: 'Song not found' });
  }

  const trackIndex = song.tracks.findIndex(t => t.id === req.params.trackId);
  if (trackIndex === -1) {
    return res.status(404).json({ error: 'Track not found' });
  }

  song.tracks.splice(trackIndex, 1);
  saveSongs();
  res.json({ message: 'Track deleted successfully' });
});

app.put('/api/songs/:songId', (req, res) => {
  const song = songs.find(s => s.id === req.params.songId);
  if (!song) {
    return res.status(404).json({ error: 'Song not found' });
  }

  Object.assign(song, {
    ...req.body,
    updatedAt: new Date()
  });

  saveSongs();
  res.json(song);
});

// Create uploads directory if it doesn't exist
import fs from 'fs';
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});
