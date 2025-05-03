import React, { useState, useEffect } from 'react';
import { getTrackFile } from '../services/api';

const AudioTest = ({ tracks, songId }) => {
  const [audioUrls, setAudioUrls] = useState({});
  // Load audio URLs when tracks change
  useEffect(() => {
    const loadAudioUrls = async () => {
      const urls = {};
      for (const track of tracks) {
        try {
          const url = await getTrackFile(songId, track.id);
          urls[track.id] = url;
          console.log(`Got URL for ${track.originalName}:`, url);
        } catch (error) {
          console.error(`Failed to get URL for ${track.originalName}:`, error);
        }
      }
      setAudioUrls(urls);
    };
    loadAudioUrls();
  }, [tracks]);

  return (
    <div style={{ padding: '20px' }}>
      <h3>Audio Test</h3>
      {tracks.map(track => (
        <div key={track.id} style={{ marginBottom: '20px' }}>
          <p>{track.originalName}</p>
          {audioUrls[track.id] ? (
            <audio 
              controls 
              src={audioUrls[track.id]}
              onError={(e) => {
                console.log('Audio error for', track.originalName, {
                  error: e.target.error,
                  src: e.target.src,
                  readyState: e.target.readyState,
                  networkState: e.target.networkState
                });
              }}
              onLoadedMetadata={(e) => {
                console.log('Audio metadata loaded for', track.originalName, {
                  duration: e.target.duration,
                  src: e.target.src,
                  readyState: e.target.readyState
                });
              }}
            />
          ) : (
            <p>Loading audio URL...</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default AudioTest;
