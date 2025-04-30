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
import SongList from './SongList';
import { getTrackFile } from '../services/api';

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
  const audioRefs = useRef({});
  const clickTrackRef = useRef(new Audio());
  const measureUpdateRef = useRef(null);

  const handleSongSelect = async (song) => {
    console.log('Selected song:', {
      id: song.id,
      title: song.title,
      tracks: song.tracks.map(t => ({ id: t.id, type: t.type }))
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
    const initialTrackStates = song.tracks.reduce((acc, track) => ({
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

        console.log('Beat analysis complete:', analysis);

        // Map beats to measures
        const measures = mapBeatsToMeasures(
          analysis.beats,
          song.timeSignature || '4/4',
          analysis.bpm
        );

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
              
              // Create and configure audio element
              const audio = new Audio(url);
              const audioContext = new (window.AudioContext || window.webkitAudioContext)();
              const source = audioContext.createMediaElementSource(audio);
              const panner = audioContext.createStereoPanner();
              const gainNode = audioContext.createGain();
              
              source.connect(panner);
              panner.connect(gainNode);
              gainNode.connect(audioContext.destination);
              
              // Store audio nodes
              audioRefs.current[track.id] = {
                audio,
                context: audioContext,
                panner,
                gain: gainNode
              };

              // Set initial volume and pan based on track state
              const trackState = trackStates[track.id] || {};
              gainNode.gain.value = trackState.muted ? 0 : (trackState.volume || 1);
              panner.pan.value = trackState.pan || 0;

              // Add time update listener to keep tracks in sync
              audio.addEventListener('timeupdate', () => {
                const diff = Math.abs(audio.currentTime - clickTrackRef.current.currentTime);
                if (diff > 0.05) {
                  clickTrackRef.current.currentTime = 0;
                  clickTrackRef.current.pause();
                  Object.values(audioRefs.current).forEach(({ audio }) => {
                    audio.currentTime = 0;
                    audio.pause();
                  });
                }
              });
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
    if (!currentSong) return;

    try {
      if (isPlaying) {
        // Pause all tracks
        Object.values(audioRefs.current).forEach(({ audio }) => {
          audio.pause();
        });
        stopMeasureCounter();
      } else {
        // Play all tracks that aren't muted
        Object.entries(audioRefs.current).forEach(([id, { audio }]) => {
          if (shouldTrackPlay(id)) {
            audio.play().catch(console.error);
          }
        });
        startMeasureCounter();
      }

      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error starting playback:', error);
    }
  };

  const shouldTrackPlay = (trackId) => {
    const trackState = trackStates[trackId];
    if (!trackState) return true;

    // If track is muted, don't play
    if (trackState.muted) return false;

    // If any track is soloed, only play soloed tracks
    const anySoloed = Object.values(trackStates).some(state => state.soloed);
    if (anySoloed) {
      return trackState.soloed;
    }

    return true;
  };

  const handleVolumeChange = (trackId, value) => {
    setTrackStates(prev => {
      const newStates = {
        ...prev,
        [trackId]: {
          ...prev[trackId],
          volume: value
        }
      };

      // Update audio gain
      const track = audioRefs.current[trackId];
      if (track?.gain) {
        track.gain.gain.value = shouldTrackPlay(trackId) ? value : 0;
      }

      return newStates;
    });
  };

  const handlePanChange = (trackId, value) => {
    setTrackStates(prev => {
      const newStates = {
        ...prev,
        [trackId]: {
          ...prev[trackId],
          pan: value
        }
      };

      // Update audio panner
      const track = audioRefs.current[trackId];
      if (track?.panner) {
        track.panner.pan.value = value;
      }

      return newStates;
    });
  };

  const toggleTrackMute = (trackId) => {
    setTrackStates(prev => {
      const newStates = {
        ...prev,
        [trackId]: {
          ...prev[trackId],
          muted: !prev[trackId].muted,
          // If we're muting, also unsolo
          soloed: prev[trackId].soloed && !prev[trackId].muted
        }
      };

      // Update all tracks if playing
      if (isPlaying) {
        Object.entries(audioRefs.current).forEach(([id, { audio }]) => {
          if (shouldTrackPlay(id)) {
            audio.play().catch(console.error);
          } else {
            audio.pause();
          }
        });
      }

      return newStates;
    });
  };

  const toggleTrackSolo = (trackId) => {
    setTrackStates(prev => {
      const newStates = {
        ...prev,
        [trackId]: {
          ...prev[trackId],
          soloed: !prev[trackId].soloed,
          // If we're soloing, unmute
          muted: prev[trackId].soloed ? prev[trackId].muted : false
        }
      };

      // Update all tracks if playing
      if (isPlaying) {
        Object.entries(audioRefs.current).forEach(([id, audio]) => {
          if (shouldTrackPlay(id)) {
            audio.play().catch(console.error);
          } else {
            audio.pause();
          }
        });
      }

      return newStates;
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#000000' }}>
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
          <Box sx={{ mt: 2 }}>
            {/* Song Info */}
            <Typography variant="h5" gutterBottom>
              {currentSong.title}
            </Typography>

            {/* Transport Controls */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <IconButton
                  onClick={togglePlayback}
                  color="primary"
                  size="large"
                  disabled={loadingTrack}
                >
                  {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>

                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    bgcolor: 'background.paper',
                    p: 1,
                    px: 2,
                    borderRadius: 1,
                    border: 1,
                    borderColor: 'primary.main'
                  }}
                >
                  <Typography variant="h6" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
                    {currentMeasure}:{currentBeat}:{currentSubBeat}
                  </Typography>
                </Box>
              </Box>

              {loadingTrack && (
                <Typography color="text.secondary">
                  Loading track...
                </Typography>
              )}
            </Box>

            {/* Timeline and Tracks */}
            <TrackTimeline 
                tracks={currentSong.tracks}
                beatMap={beatMap}
                currentTime={clickTrackRef.current?.currentTime || 0}
                trackStates={trackStates}
                width={800} // Fixed width for testing
                onMute={toggleTrackMute}
                onSolo={toggleTrackSolo}
                onVolumeChange={handleVolumeChange}
                onPanChange={handlePanChange}
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
