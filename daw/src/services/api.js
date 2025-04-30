import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';
const SERVER_URL = 'http://localhost:8080';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Get all songs
export const getSongs = async () => {
  try {
    const response = await api.get('/songs');
    return response.data;
  } catch (error) {
    console.error('Error fetching songs:', error);
    throw error;
  }
};

// Get a specific song by ID
export const getSongById = async (songId) => {
  console.log('Fetching song:', songId);
  try {
    const response = await api.get(`/songs/${songId}`);
    console.log('Got song:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching song:', error);
    throw error;
  }
};

// Get a track file by song ID and track ID
export const getTrackFile = async (songId, trackId) => {
  console.log(`Fetching track file for song ${songId}, track ${trackId}`);
  try {
    // First get the song to find the track's file path
    const songResponse = await api.get(`/songs/${songId}`);
    const song = songResponse.data;
    console.log('Found song:', song.title);

    const track = song.tracks.find(t => t.id === trackId);
    if (!track) {
      throw new Error(`Track not found with ID: ${trackId}`);
    }
    console.log('Found track:', track);

    // Construct the URL for the audio file
    const url = `${SERVER_URL}${track.filePath}`;
    console.log('Fetching audio from URL:', url);

    // Try to fetch the audio file
    const response = await fetch(url, {
      headers: {
        'Accept': 'audio/mpeg, audio/*',
        'Range': 'bytes=0-'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch audio file: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    console.log('Successfully got audio blob:', {
      size: blob.size,
      type: blob.type
    });

    return blob;
  } catch (error) {
    console.error('Error in getTrackFile:', error);
    throw error;
  }
};
