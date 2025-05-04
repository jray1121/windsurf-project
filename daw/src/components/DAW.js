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
  TextField,
  Checkbox,
  FormControlLabel,
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
  const [visibleMeasures, setVisibleMeasures] = useState(8); // Default to 8 measures visible
  const [jumpToMeasure, setJumpToMeasure] = useState('');
  const [isLoopEnabled, setIsLoopEnabled] = useState(false);
  const audioRefs = useRef({});
  const clickTrackRef = useRef(new Audio());
  const measureUpdateRef = useRef(null);

  const handleZoomChange = (measures) => {
    setVisibleMeasures(measures);
  };

  const handleJumpToMeasure = () => {
    const measure = parseInt(jumpToMeasure);
    if (!isNaN(measure) && measure > 0) {
      if (clickTrackRef.current && beatMap) {
        console.log('Current beatMap:', beatMap);

        // Find all beats in the target measure
        const measureBeats = beatMap.filter(beat => beat.measure === measure);
        console.log('Found beats for measure:', measureBeats);

        if (measureBeats.length > 0) {
          // Get the first beat of the measure
          const targetBeat = measureBeats[0];
          const targetTime = targetBeat.time;
          console.log('Target measure:', measure);
          console.log('Target time:', targetTime);
          console.log('Click track duration:', clickTrackRef.current.duration);

          // Ensure we're not at the end of the audio
          if (targetTime >= clickTrackRef.current.duration) {
            console.warn('Target time is beyond audio duration');
            return;
          }

          // Update click track time with a small offset to avoid edge cases
          const timeOffset = 0.01; // 10ms offset
          clickTrackRef.current.currentTime = targetTime + timeOffset;

          // Update all audio tracks to the same time
          Object.values(audioRefs.current).forEach(audio => {
            if (audio && typeof audio.currentTime === 'number') {
              audio.currentTime = targetTime + timeOffset;
            }
          });

          // Update measure counter display
          setCurrentMeasure(measure);
          setCurrentBeat(1);
          setCurrentSubBeat(1);

          // Always stop the measure counter when jumping
          stopMeasureCounter();

          console.log('After jump - Click track time:', clickTrackRef.current.currentTime);
        } else {
          console.warn(`Measure ${measure} not found in beat map`);
        }
      }
    }
  };

  const stopPlayback = () => {
    // First stop all playback
    setIsPlaying(false);
    if (clickTrackRef.current) {
      clickTrackRef.current.pause();
    }
    Object.values(audioRefs.current).forEach(audio => {
      if (audio && typeof audio.pause === 'function') {
        audio.pause();
      }
    });

    // Then handle the hold behavior
    if (isLoopEnabled && jumpToMeasure) {
      handleJumpToMeasure();
    } else {
      resetMeasureCounter();
    }
  };

  const handleSongSelect = async (song) => {
    try {
      setLoadingTrack(true);
      console.log('Selected song:', song);
      
      // Reset states
      setCurrentSong(null);
      setBeatMap(null);
      setTrackStates({});
      setIsPlaying(false);
      setMenuOpen(false);
      setCurrentMeasure(1);
      setCurrentBeat(1);
      setCurrentSubBeat(1);
      
      // Stop any existing playback
      if (clickTrackRef.current) {
        clickTrackRef.current.pause();
      }
      Object.values(audioRefs.current).forEach(audio => {
        if (audio && typeof audio.pause === 'function') {
          audio.pause();
        }
      });

      // Clear existing audio references and gain nodes
      audioRefs.current = {};
      gainNodes.current = {};

      // Initialize audio context if not already done
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      // Load click track first
      const clickTrack = song.tracks.find(track => track.type === 'click');
      if (clickTrack) {
        try {
          const clickTrackFile = await getTrackFile(clickTrack.id);
          clickTrackRef.current.src = clickTrackFile;
          await clickTrackRef.current.load();
          console.log('Click track loaded');
        } catch (error) {
          console.error('Error loading click track:', error);
          // Continue without click track
        }
      }

      // Load all other tracks
      const trackLoadPromises = song.tracks
        .filter(track => track.type !== 'click')
        .map(async track => {
          try {
            const audioFile = await getTrackFile(track.id);
            const audio = new Audio();
            audio.src = audioFile;
            await audio.load();
            
            // Create gain node for volume control
            const gainNode = audioContext.current.createGain();
            const source = audioContext.current.createMediaElementSource(audio);
            source.connect(gainNode);
            gainNode.connect(audioContext.current.destination);
            
            // Store references
            audioRefs.current[track.id] = audio;
            gainNodes.current[track.id] = gainNode;
            
            // Initialize track state
            setTrackStates(prev => ({
              ...prev,
              [track.id]: {
                muted: false,
                soloed: false,
                volume: 1,
                pan: 0
              }
            }));

            console.log(`Track ${track.id} loaded`);
          } catch (error) {
            console.error(`Error loading track ${track.id}:`, error);
          }
        });

      await Promise.all(trackLoadPromises);

      // Analyze beats if we have a click track
      if (clickTrackRef.current && clickTrackRef.current.src) {
        try {
          // Get beat times from click track
          const measures = await analyzeBeats(clickTrackRef.current);
          console.log('Analyzed beats:', measures);

          // Map beats to measures
          const beatMapWithNext = measures.map((beat, index) => ({
            ...beat,
            nextBeatTime: measures[index + 1]?.time
          }));

          setBeatMap(beatMapWithNext);
          console.log('Beat map created:', beatMapWithNext);
        } catch (error) {
          console.error('Error analyzing beats:', error);
        }
      }

      setCurrentSong(song);
      setLoadingTrack(false);
      console.log('Song loaded successfully');
    } catch (error) {
      console.error('Error in handleSongSelect:', error);
      setLoadingTrack(false);
    }
  };

  const updateMeasureDisplay = (currentTime) => {
    if (!beatMap) return;

    // Find the current beat
    const currentBeatIndex = beatMap.findIndex((beat, index) => {
      const nextBeatTime = beatMap[index + 1]?.time;
      return currentTime >= beat.time && (!nextBeatTime || currentTime < nextBeatTime);
    });

    if (currentBeatIndex !== -1) {
      const beat = beatMap[currentBeatIndex];
      setCurrentMeasure(beat.measure);
      setCurrentBeat(beat.beat);
      setCurrentSubBeat(beat.subBeat);
    }
  };

  const startMeasureCounter = () => {
    if (measureUpdateRef.current) {
      clearInterval(measureUpdateRef.current);
    }

    measureUpdateRef.current = setInterval(() => {
      if (clickTrackRef.current) {
        updateMeasureDisplay(clickTrackRef.current.currentTime);
      }
    }, 50); // Update every 50ms
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
        setIsPlaying(false);
        stopMeasureCounter();

        // Pause all tracks but maintain position
        if (clickTrackRef.current) {
          clickTrackRef.current.pause();
        }
        Object.values(audioRefs.current).forEach(audio => {
          if (audio && typeof audio.pause === 'function') {
            audio.pause();
          }
        });
      } else {
        console.log('Starting playback');
        setIsPlaying(true);

        // Get current time from click track
        const startTime = clickTrackRef.current ? clickTrackRef.current.currentTime : 0;
        console.log('Starting from time:', startTime);

        // If hold is not enabled, reset the measure input since we won't use it anymore
        if (!isLoopEnabled && jumpToMeasure) {
          setJumpToMeasure('');
        }

        // Get all tracks that should play
        const tracksToPlay = [];

        // Add click track if not muted
        if (clickTrackRef.current && !isClickTrackMuted) {
          tracksToPlay.push({ id: 'click', audio: clickTrackRef.current });
        }

        // Add all other tracks that should play
        Object.entries(audioRefs.current).forEach(([id, audio]) => {
          const trackState = trackStates[id];
          const anySoloed = Object.values(trackStates).some(state => state?.soloed);
          
          // If any track is soloed, only play soloed tracks
          if (anySoloed) {
            if (trackState?.soloed) {
              tracksToPlay.push({ id, audio });
            }
          } else {
            // If no tracks are soloed, play all unmuted tracks
            if (!trackState?.muted) {
              tracksToPlay.push({ id, audio });
            }
          }
        });

        console.log('Playing tracks:', tracksToPlay.map(t => t.id));

        // Play all tracks simultaneously
        const playPromises = tracksToPlay.map(({ id, audio }) => {
          if (!audio) {
            console.warn(`Audio not found for track ${id}`);
            return Promise.resolve();
          }
          return audio.play()
            .then(() => console.log(`Track ${id} started successfully`))
            .catch(err => console.error(`Error playing track ${id}:`, err));
        });

        await Promise.all(playPromises);

        // Start measure counter last
        startMeasureCounter();
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
      setIsPlaying(false);
      stopMeasureCounter();

      // Pause all tracks but maintain position
      if (clickTrackRef.current) {
        clickTrackRef.current.pause();
      }
      Object.values(audioRefs.current).forEach(audio => {
        if (audio && typeof audio.pause === 'function') {
          audio.pause();
        }
      });
    }
  };

  const handleVolumeChange = (trackId, value) => {
    setTrackStates(prevStates => ({
      ...prevStates,
      [trackId]: {
        ...prevStates[trackId],
        volume: value
      }
    }));

    // Update the gain node if it exists
    const gainNode = gainNodes.current[trackId];
    if (gainNode && audioContext.current) {
      gainNode.gain.setValueAtTime(value, audioContext.current.currentTime);
    }
  };

  const handlePanChange = (trackId, value) => {
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
      const newStates = {
        ...prev,
        [trackId]: {
          ...prev[trackId],
          muted: !prev[trackId]?.muted,
          soloed: prev[trackId]?.soloed && prev[trackId]?.muted
        }
      };

      const gainNode = gainNodes.current[trackId];
      if (gainNode && audioContext.current) {
        const shouldPlay = !newStates[trackId].muted && 
          (!Object.values(newStates).some(state => state?.soloed) || newStates[trackId].soloed);
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
      const newStates = {
        ...prev,
        [trackId]: {
          ...prev[trackId],
          soloed: !prev[trackId]?.soloed
        }
      };

      const anySoloed = Object.values(newStates).some(state => state?.soloed);
      
      Object.entries(audioRefs.current).forEach(([id, audio]) => {
        if (audio && typeof audio.volume === 'number') {
          const trackState = newStates[id] || {};
          const oldShouldPlay = prev[id]?.soloed || (!Object.values(prev).some(state => state?.soloed) && !prev[id]?.muted);
          const newShouldPlay = trackState.soloed || (!anySoloed && !trackState.muted);
          
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
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            PlayEXL
          </Typography>
          {currentSong && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                onClick={togglePlayback}
                startIcon={isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                sx={{
                  bgcolor: '#873995',
                  '&:hover': {
                    bgcolor: '#6c2d77'
                  }
                }}
              >
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <Button
                variant="contained"
                onClick={stopPlayback}
                startIcon={<StopIcon />}
                sx={{
                  bgcolor: '#333333',
                  '&:hover': {
                    bgcolor: '#444444'
                  }
                }}
              >
                Stop
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Song List Dialog */}
      <SongList
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        songs={songs}
        loading={loading}
        onSelect={handleSongSelect}
      />

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
        {currentSong ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Song Info */}
            <SongInfo song={currentSong} />

            {/* Controls */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {/* Measure Controls */}
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                bgcolor: '#000000',
                px: 1.5,
                py: 0.6,
                borderRadius: 1,
                border: '1px solid #333333',
                gap: 2,
                height: '46px'
              }}>
                <Typography sx={{ color: '#999999', fontSize: '0.875rem' }}>
                  {`${currentMeasure}.${currentBeat}.${currentSubBeat}`}
                </Typography>
                <TextField
                  value={jumpToMeasure}
                  onChange={(e) => setJumpToMeasure(e.target.value)}
                  placeholder="Measure"
                  size="small"
                  sx={{
                    width: '80px',
                    '& .MuiOutlinedInput-root': {
                      color: '#ffffff',
                      bgcolor: '#1a1a1a',
                      '& fieldset': {
                        borderColor: '#333333',
                      },
                      '&:hover fieldset': {
                        borderColor: '#444444',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#873995',
                      },
                    },
                    '& .MuiOutlinedInput-input': {
                      padding: '4px 8px',
                    },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleJumpToMeasure}
                  sx={{
                    bgcolor: '#333333',
                    color: '#ffffff',
                    '&:hover': {
                      bgcolor: '#444444'
                    },
                    minWidth: 'unset',
                    height: '32px'
                  }}
                >
                  Go
                </Button>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isLoopEnabled}
                      onChange={(e) => setIsLoopEnabled(e.target.checked)}
                      sx={{
                        color: '#666666',
                        '&.Mui-checked': {
                          color: '#873995'
                        }
                      }}
                    />
                  }
                  label="Hold"
                  sx={{
                    m: 0,
                    '& .MuiFormControlLabel-label': {
                      color: '#999999',
                      fontSize: '0.875rem'
                    }
                  }}
                />
              </Box>

              {/* Zoom Controls */}
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                bgcolor: '#000000',
                px: 1.5,
                py: 0.6,
                borderRadius: 1,
                border: '1px solid #333333',
                gap: 2,
                height: '46px'
              }}>
                <Typography sx={{ color: '#999999', fontSize: '0.875rem' }}>View</Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {[4, 8, 12, 16].map((measures) => (
                    <Button
                      key={measures}
                      variant={visibleMeasures === measures ? 'contained' : 'outlined'}
                      onClick={() => handleZoomChange(measures)}
                      sx={{
                        bgcolor: visibleMeasures === measures ? '#873995' : '#333333',
                        color: '#ffffff',
                        '&:hover': {
                          bgcolor: visibleMeasures === measures ? '#873995' : '#444444'
                        },
                        minWidth: '45px',
                        height: '36px',
                        display: 'flex',
                        flexDirection: 'column',
                        p: 0.5
                      }}
                    >
                      <Typography sx={{ lineHeight: 1, fontSize: '0.95rem' }}>{measures}</Typography>
                      <Typography sx={{ lineHeight: 1, fontSize: '0.65rem' }}>bars</Typography>
                    </Button>
                  ))}
                </Box>
              </Box>
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
                visibleMeasures={visibleMeasures}
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
