import React, { useState, useRef, useEffect } from 'react';
import { analyzeBeats, mapBeatsToMeasures } from '../utils/audioAnalysis';
import TrackTimeline from './TrackTimeline';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Container,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import SongList from './SongList';
import { getTrackFile } from '../services/api';
import SongInfo from './SongInfo';

const DAW = ({ songs = [], loading = false }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingTrack, setLoadingTrack] = useState(false);
  const [currentMeasure, setCurrentMeasure] = useState(1);
  const [currentBeat, setCurrentBeat] = useState(1);
  const [currentSubBeat, setCurrentSubBeat] = useState(1);
  const [beatMap, setBeatMap] = useState(null);
  const [trackStates, setTrackStates] = useState({});
  const audioContext = useRef(null);
  const gainNodes = useRef({});
  const [isClickTrackMuted, setIsClickTrackMuted] = useState(false);
  const audioRefs = useRef({});
  const clickTrackRef = useRef(new Audio());
  const measureUpdateRef = useRef(null);

  const stopPlayback = () => {
    setIsPlaying(false);
    if (clickTrackRef.current) {
      clickTrackRef.current.pause();
      clickTrackRef.current.currentTime = 0;
    }
    Object.values(audioRefs.current).forEach(audio => {
      if (audio && typeof audio.pause === 'function') {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    resetMeasureCounter();
  };

  const handleSongSelect = async (song) => {
    // Log raw song data first
    console.log('Raw song data:', {
      timeSignature: song.timeSignature,
      timeSignatureChanges: song.timeSignatureChanges,
      rawChangesType: typeof song.timeSignatureChanges
    });

    // Try parsing if it's a string
    if (typeof song.timeSignatureChanges === 'string') {
      try {
        song.timeSignatureChanges = JSON.parse(song.timeSignatureChanges);
        console.log('Parsed time signature changes:', song.timeSignatureChanges);
      } catch (e) {
        console.error('Failed to parse time signature changes:', e);
      }
    }

    console.log('Selected song:', {
      id: song.id,
      title: song.title,
      tracks: song.tracks.map(t => ({ id: t.id, type: t.type })),
      timeSignature: song.timeSignature,
      timeSignatureChanges: song.timeSignatureChanges
    });

    // Log time signature info in detail
    console.log('Time Signature Details:', {
      base: song.timeSignature,
      changes: song.timeSignatureChanges,
      changesType: typeof song.timeSignatureChanges,
      isArray: Array.isArray(song.timeSignatureChanges)
    });

    // Stop any current playback and reset audio refs
    Object.values(audioRefs.current).forEach(audio => {
      audio.pause();
      audio.src = '';
    });
    clickTrackRef.current.pause();
    clickTrackRef.current.src = '';
    audioRefs.current = {};
    
    // Initialize track states
    const initialTrackStates = song.tracks
      .filter(track => track.type !== 'click')
      .reduce((acc, track) => ({
        ...acc,
        [track.id]: { 
          muted: false, 
          soloed: false,
          volume: 1,
          pan: 0
        }
      }), {});
    setTrackStates(initialTrackStates);
    
    setCurrentSong(song);
    setIsPlaying(false);
    setLoadingTrack(true);

    // Find the click track
    const clickTrack = song.tracks.find(track => track.type === 'click');
    if (clickTrack) {
      console.log('Found click track:', {
        id: clickTrack.id,
        filePath: clickTrack.filePath
      });

      try {
        const blob = await getTrackFile(song.id, clickTrack.id);
        console.log('Got audio blob:', {
          size: blob.size,
          type: blob.type
        });

        const url = URL.createObjectURL(blob);
        console.log('Created object URL:', url);
        
        // Analyze the audio for beats
        const analysis = await analyzeBeats(blob, {
          timeSignature: song.timeSignature || '4/4',
          beatValue: song.beatValue || '1/4'
        });

        console.log('Beat analysis complete:', {
          analysis,
          bpm: analysis.bpm,
          changes: song.timeSignatureChanges || []
        });

        // Map beats to measures with time signature changes
        const measures = mapBeatsToMeasures(
          analysis.beats,
          song.timeSignatureChanges || []
        );

        // Log first few measures
        console.log('First 5 measures:', measures.slice(0, 5));

        // Add next beat time for sub-beat calculation
        const beatMapWithNext = measures.map((beat, index) => ({
          ...beat,
          nextBeatTime: measures[index + 1]?.time
        }));

        setBeatMap(beatMapWithNext);

        // Set up click track audio
        clickTrackRef.current = new Audio();
        
        // Add event listeners to click track
        clickTrackRef.current.addEventListener('canplaythrough', () => {
          console.log('Click track can play through');
          setLoadingTrack(false);
        });

        clickTrackRef.current.addEventListener('error', (e) => {
          console.error('Click track error:', e);
          setLoadingTrack(false);
        });

        // Load the click track
        clickTrackRef.current.src = url;
        clickTrackRef.current.load();

        // Load all other tracks
        await Promise.all(song.tracks.map(async track => {
          if (track.type !== 'click') {
            try {
              const blob = await getTrackFile(song.id, track.id);
              const url = URL.createObjectURL(blob);
              
              // Create audio context if it doesn't exist
              if (!audioContext.current) {
                audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
              }

              // Create and configure audio element
              const audio = new Audio();
              audio.src = url;

              // Create audio source and gain node
              const source = audioContext.current.createMediaElementSource(audio);
              const gainNode = audioContext.current.createGain();
              source.connect(gainNode);
              gainNode.connect(audioContext.current.destination);

              // Store references
              audioRefs.current[track.id] = audio;
              gainNodes.current[track.id] = gainNode;

              // Add time update listener to keep tracks in sync
              audio.addEventListener('timeupdate', () => {
                if (!clickTrackRef.current) return;
                
                const diff = Math.abs(audio.currentTime - clickTrackRef.current.currentTime);
                if (diff > 0.1) {
                  audio.currentTime = clickTrackRef.current.currentTime;
                }
              });

              // Add error listener
              audio.addEventListener('error', (e) => {
                console.error(`Error with track ${track.id}:`, e);
              });

              // Set initial volume based on track state
              const trackState = trackStates[track.id] || {};
              gainNode.gain.setValueAtTime(
                trackState.muted ? 0 : (trackState.volume || 1),
                audioContext.current.currentTime
              );

              // Load the audio
              await audio.load();
            } catch (error) {
              console.error(`Error loading track ${track.id}:`, error);
            }
          }
        }));
      } catch (error) {
        console.error('Error loading click track:', error);
        setLoadingTrack(false);
      }
    } else {
      console.log('No click track found in song:', song.title);
      setLoadingTrack(false);
    }
  };

  const updateMeasureDisplay = (currentTime) => {
    if (!beatMap) return;

    // Find the current beat in our beat map
    const currentBeatInfo = beatMap.find((beat, index) => {
      const nextBeat = beatMap[index + 1];
      return currentTime >= beat.time && (!nextBeat || currentTime < nextBeat.time);
    });

    if (currentBeatInfo) {
      setCurrentMeasure(currentBeatInfo.measure);
      setCurrentBeat(currentBeatInfo.beat);
      
      // Calculate sub-beat based on position between beats
      if (currentBeatInfo.nextBeatTime) {
        const beatProgress = (currentTime - currentBeatInfo.time) / 
          (currentBeatInfo.nextBeatTime - currentBeatInfo.time);
        setCurrentSubBeat(Math.floor(beatProgress * 4) + 1);
      }
    }
  };

  const startMeasureCounter = () => {
    if (!beatMap || measureUpdateRef.current) return;

    const updateInterval = 50; // Update every 50ms for smooth counter

    measureUpdateRef.current = setInterval(() => {
      if (clickTrackRef.current) {
        updateMeasureDisplay(clickTrackRef.current.currentTime);
      }
    }, updateInterval);
  };

  const stopMeasureCounter = () => {
    if (measureUpdateRef.current) {
      clearInterval(measureUpdateRef.current);
      measureUpdateRef.current = null;
    }
  };

  const resetMeasureCounter = () => {
    setCurrentMeasure(1);
    setCurrentBeat(1);
    setCurrentSubBeat(1);
  };

  const togglePlayback = async () => {
    try {
      if (isPlaying) {
        console.log('Stopping playback');
        // Pause all tracks
        if (clickTrackRef.current) {
          clickTrackRef.current.pause();
          clickTrackRef.current.currentTime = 0;
        }
        Object.values(audioRefs.current).forEach(audio => {
          if (audio && typeof audio.pause === 'function') {
            audio.pause();
            audio.currentTime = 0;
          }
        });
        stopMeasureCounter();
        setIsPlaying(false);
      } else {
        console.log('Starting playback');
        // Reset all times to 0
        if (clickTrackRef.current) {
          clickTrackRef.current.currentTime = 0;
        }
        Object.values(audioRefs.current).forEach(audio => {
          if (audio) audio.currentTime = 0;
        });

        // Start playback
        setIsPlaying(true);
        startMeasureCounter();
        
        // Play all tracks that should play
        const tracksToPlay = [];
        
        if (clickTrackRef.current && !isClickTrackMuted) {
          tracksToPlay.push({ id: 'click', audio: clickTrackRef.current });
        }

        Object.entries(audioRefs.current).forEach(([id, audio]) => {
          if (shouldTrackPlay(id) && audio && typeof audio.play === 'function') {
            tracksToPlay.push({ id, audio });
          }
        });

        console.log('Playing tracks:', tracksToPlay.map(t => t.id));

        // Play all tracks simultaneously
        const playPromises = tracksToPlay.map(({ id, audio }) => {
          return audio.play()
            .then(() => console.log(`Track ${id} started successfully`))
            .catch(err => console.error(`Error playing track ${id}:`, err));
        });

        await Promise.all(playPromises);
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
      // If playback fails, reset to stopped state
      setIsPlaying(false);
      stopMeasureCounter();
    }
  };

  const shouldTrackPlay = (trackId) => {
    const trackState = trackStates[trackId];
    if (!trackState) return true;

    // If any track is soloed, only play soloed tracks
    const anySoloed = Object.values(trackStates).some(state => state.soloed);
    if (anySoloed) {
      return trackState.soloed;
    }

    // If no tracks are soloed, play if not muted
    return !trackState.muted;
  };

  const handleVolumeChange = (trackId, value) => {
    const audio = audioRefs.current[trackId];
    if (audio && typeof audio.volume === 'number') {
      audio.volume = value;
    }

    setTrackStates(prevStates => ({
      ...prevStates,
      [trackId]: {
        ...prevStates[trackId],
        volume: value
      }
    }));
  };

  const handlePanChange = (trackId, value) => {
    // Note: Basic Audio elements don't support panning, we'll just store the state for now
    setTrackStates(prevStates => ({
      ...prevStates,
      [trackId]: {
        ...prevStates[trackId],
        pan: value
      }
    }));
  };

  const toggleTrackMute = (trackId) => {
    setTrackStates(prev => {
      // Calculate new state
      const newStates = {
        ...prev,
        [trackId]: {
          ...prev[trackId],
          muted: !prev[trackId].muted,
          // If we're unmuting, also unsolo if any other track is soloed
          soloed: prev[trackId].soloed && prev[trackId].muted
        }
      };

      // Only update the toggled track's volume
      const gainNode = gainNodes.current[trackId];
      if (gainNode && audioContext.current) {
        const shouldPlay = !newStates[trackId].muted && 
          (!Object.values(newStates).some(state => state.soloed) || newStates[trackId].soloed);
        gainNode.gain.setValueAtTime(
          shouldPlay ? (newStates[trackId].volume || 1) : 0,
          audioContext.current.currentTime
        );
      }

      return newStates;
    });
  };

  const toggleTrackSolo = (trackId) => {
    setTrackStates(prev => {
      // Calculate new state - just toggle solo for this track
      const newStates = {
        ...prev,
        [trackId]: {
          ...prev[trackId],
          soloed: !prev[trackId]?.soloed
        }
      };

      // Check if any track will be soloed
      const anySoloed = Object.values(newStates).some(state => state.soloed);
      
      // Only update volumes for tracks that need to change
      Object.entries(audioRefs.current).forEach(([id, audio]) => {
        if (audio && typeof audio.volume === 'number') {
          const trackState = newStates[id] || {};
          const oldShouldPlay = prev[id]?.soloed || (!Object.values(prev).some(state => state.soloed) && !prev[id]?.muted);
          const newShouldPlay = trackState.soloed || (!anySoloed && !trackState.muted);
          
          // Only update volume if the play state changed
          if (oldShouldPlay !== newShouldPlay && gainNodes.current[id] && audioContext.current) {
            gainNodes.current[id].gain.setValueAtTime(
              newShouldPlay ? (trackState.volume || 1) : 0,
              audioContext.current.currentTime
            );
          }
        }
      });

      return newStates;
    });
  };

  return (
    <Box sx={{ height: '100vh', bgcolor: '#000000', display: 'flex', flexDirection: 'column' }}>
      {/* App Bar */}
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            sx={{ mr: 2 }}
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {currentSong ? currentSong.title : 'PlayEXL'}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Song List Drawer */}
      <SongList
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        songs={songs}
        loading={loading}
        onSongSelect={handleSongSelect}
      />

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, backgroundColor: '#000000 !important', width: '100%' }}>
        {currentSong ? (
          <Box sx={{ height: '100%', bgcolor: '#121212' }}>
            <SongInfo
              title={currentSong.title}
              composer={currentSong.composer}
              lyricist={currentSong.lyricist}
              arranger={currentSong.arranger}
            />

            {/* Transport Controls */}
            <Box sx={{ 
              mb: 3, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              width: '100%'
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                bgcolor: '#1a1a1a',
                p: 1,
                borderRadius: 1,
                border: '1px solid #333333'
              }}>
                <IconButton
                  onClick={togglePlayback}
                  color="primary"
                  size="medium"
                  disabled={loadingTrack}
                  sx={{ 
                    '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.08)' },
                    color: '#1976d2'
                  }}
                >
                  {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>

                <IconButton
                  onClick={stopPlayback}
                  size="medium"
                  disabled={loadingTrack}
                  sx={{ 
                    '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.08)' },
                    color: '#1976d2'
                  }}
                >
                  <StopIcon />
                </IconButton>

                <Box sx={{ mx: 1, width: 1, bgcolor: '#333333', height: 24 }} />

                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    bgcolor: '#000000',
                    p: 1,
                    px: 2,
                    borderRadius: 1,
                    border: '1px solid #333333',
                    minWidth: 100
                  }}
                >
                  <Typography variant="h6" sx={{ 
                    fontFamily: 'monospace', 
                    color: '#1976d2',
                    fontSize: '1rem',
                    textAlign: 'center',
                    width: '100%'
                  }}>
                    {currentMeasure}:{currentBeat}:{currentSubBeat}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                bgcolor: '#1a1a1a',
                p: 1,
                borderRadius: 1,
                border: '1px solid #333333'
              }}>
                <Typography sx={{ color: '#999999' }}>Metronome</Typography>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => {
                    setIsClickTrackMuted(!isClickTrackMuted);
                    if (clickTrackRef.current) {
                      clickTrackRef.current.muted = !isClickTrackMuted;
                    }
                  }}
                  sx={{
                    bgcolor: isClickTrackMuted ? '#333333' : '#1976d2',
                    color: '#ffffff',
                    '&:hover': {
                      bgcolor: isClickTrackMuted ? '#444444' : '#1565c0'
                    },
                    minWidth: '60px'
                  }}
                >
                  {isClickTrackMuted ? 'Off' : 'On'}
                </Button>
              </Box>

              {loadingTrack && (
                <Typography color="text.secondary">
                  Loading track...
                </Typography>
              )}
            </Box>

            {/* Timeline and Tracks */}
            <TrackTimeline 
                tracks={currentSong.tracks.filter(track => track.type !== 'click')}
                beatMap={beatMap}
                currentTime={clickTrackRef.current?.currentTime || 0}
                trackStates={trackStates}
                width={800} // Fixed width for testing
                onMute={toggleTrackMute}
                onSolo={toggleTrackSolo}
                onVolumeChange={handleVolumeChange}
                onPanChange={handlePanChange}
                isClickTrackMuted={isClickTrackMuted}
                timeSignatureChanges={currentSong.timeSignatureChanges}
                onClickTrackToggle={() => {
                  setIsClickTrackMuted(!isClickTrackMuted);
                  if (clickTrackRef.current) {
                    clickTrackRef.current.muted = !isClickTrackMuted;
                  }
                }}
              />
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <Typography variant="h5" gutterBottom>
              Welcome to PlayEXL
            </Typography>
            <Button
              variant="contained"
              onClick={() => setMenuOpen(true)}
            >
              Select a Song
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default DAW;
