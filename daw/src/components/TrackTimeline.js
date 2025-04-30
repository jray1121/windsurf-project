import React from 'react';
import { Typography } from '@mui/material';
import TrackControls from './TrackControls';

const PIXELS_PER_BEAT = 80;
const TIMELINE_HEIGHT = 40;
const HEADER_WIDTH = 200;

// Format track name from snake_case to Title Case
export const formatTrackName = (name) => {
  if (!name) return 'Untitled Track';
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const getMeasuresFromBeatMap = (beatMap) => {
  if (!beatMap || !beatMap.length) return [];
  
  // Get the last beat to determine total measures
  const lastBeat = beatMap[beatMap.length - 1];
  const totalMeasures = lastBeat.measure;
  
  // Create array of measures
  return Array.from({ length: totalMeasures }, (_, i) => {
    const measureNumber = i + 1;
    // Find the first beat of this measure
    const firstBeatOfMeasure = beatMap.find(beat => beat.measure === measureNumber);
    return {
      number: measureNumber,
      startTime: firstBeatOfMeasure ? firstBeatOfMeasure.time * PIXELS_PER_BEAT : 0
    };
  });
};

const TimelineRuler = ({ beatMap, currentTime, totalWidth }) => {
  const measures = getMeasuresFromBeatMap(beatMap);
  const currentPosition = currentTime * PIXELS_PER_BEAT;
  
  return (
    <div style={{
      display: 'flex',
      height: TIMELINE_HEIGHT,
      borderTop: '2px solid #333333',
      borderBottom: '2px solid #333333',
      backgroundColor: '#000000',
      position: 'relative',
      zIndex: 10
    }}>
      <div style={{
        position: 'relative',
        width: totalWidth,
        height: '100%',
        backgroundColor: '#000000'
      }}>
        {measures.map((measure) => (
          <div
            key={`measure-${measure.number}`}
            style={{
              position: 'absolute',
              left: measure.startTime,
              top: 0,
              height: '100%',
              width: 1,
              backgroundColor: '#666666'
            }}
          />
        ))}

        {measures.map((measure) => (
          <Typography
            key={`measure-${measure.number}`}
            variant="caption"
            sx={{
              position: 'absolute',
              left: measure.startTime + 4,
              top: 4,
              color: '#999999'
            }}
          >
            {measure.number}
          </Typography>
        ))}

        <div
          style={{
            position: 'absolute',
            left: currentPosition,
            top: 0,
            height: '100%',
            width: 2,
            backgroundColor: '#ff3333',
            zIndex: 2,
            transition: 'left 0.1s linear'
          }}
        />
      </div>
    </div>
  );
};

const TrackTimeline = ({ 
  tracks, 
  beatMap, 
  currentTime, 
  trackStates = {}, 
  onMute, 
  onSolo,
  onVolumeChange = () => {},
  onPanChange = () => {}
}) => {
  const containerRef = React.useRef(null);
  const measures = getMeasuresFromBeatMap(beatMap);
  const totalWidth = measures.length * PIXELS_PER_BEAT * 4; // 4 beats per measure
  const minWidth = Math.max(totalWidth, window.innerWidth - HEADER_WIDTH); // At least window width

  // Auto-scroll to follow playback
  React.useEffect(() => {
    if (currentTime !== undefined && containerRef.current) {
      const position = currentTime * PIXELS_PER_BEAT;
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const scrollPosition = container.scrollLeft;
      const margin = 200; // pixels from edge before scrolling

      // Only scroll if playhead is getting close to the edge of view
      if (position > scrollPosition + containerWidth - margin || position < scrollPosition + margin) {
        // Center the playhead
        container.scrollTo({
          left: Math.max(0, position - containerWidth / 2),
          behavior: 'smooth'
        });
      }
    }
  }, [currentTime]);

  return (
    <div style={{
      position: 'relative',
      backgroundColor: '#000000',
      minHeight: 200,
      width: '100%',
      overflow: 'hidden',
      zIndex: 10
    }}>
      <div style={{
        display: 'flex',
        position: 'relative',
        backgroundColor: '#000000'
      }}>
        {/* Fixed headers container */}
        <div style={{
          width: HEADER_WIDTH,
          flexShrink: 0,
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Fixed header spacer for timeline */}
          <div style={{
            height: TIMELINE_HEIGHT,
            backgroundColor: '#1a1a1a',
            borderRight: '1px solid #333333',
            borderTop: '2px solid #333333',
            borderBottom: '2px solid #333333'
          }} />

          {/* Fixed track headers */}
          <div style={{
            backgroundColor: '#1a1a1a',
            borderRight: '1px solid #333333'
          }}>
            {tracks?.map((track) => (
              <div
                key={track.id}
                style={{
                  height: 80,
                  borderBottom: '1px solid #333333'
                }}
              >
                <TrackControls
                  track={track}
                  isMuted={trackStates[track.id]?.muted}
                  isSoloed={trackStates[track.id]?.soloed}
                  volume={trackStates[track.id]?.volume || 1}
                  pan={trackStates[track.id]?.pan || 0}
                  onMute={() => onMute(track.id)}
                  onSolo={() => onSolo(track.id)}
                  onVolumeChange={(value) => onVolumeChange(track.id, value)}
                  onPanChange={(value) => onPanChange(track.id, value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div 
          ref={containerRef}
          className="timeline-scroll"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflowX: 'auto',
            overflowY: 'hidden',
            backgroundColor: '#000000',
            zIndex: 10
          }}
        >
          {/* Timeline ruler */}
          <TimelineRuler beatMap={beatMap} currentTime={currentTime} totalWidth={totalWidth} />

          {/* Scrollable tracks */}
          <div style={{ backgroundColor: '#000000', zIndex: 10 }}>
            {tracks?.map((track) => (
              <div
                key={track.id}
                style={{
                  height: 80,
                  borderBottom: '1px solid #333333',
                  backgroundColor: '#000000',
                  position: 'relative',
                  width: totalWidth,
                  minWidth: minWidth,
                  zIndex: 10
                }}
              >
                {/* Grid lines */}
                <div style={{
                  width: totalWidth,
                  minWidth: minWidth,
                  height: '100%',
                  position: 'relative',
                  backgroundColor: '#000000',
                  zIndex: 10
                }}>
                  {measures.map((measure) => (
                    <div
                      key={`grid-${measure.number}`}
                      style={{
                        position: 'absolute',
                        left: measure.startTime,
                        top: 0,
                        height: '100%',
                        width: 1,
                        backgroundColor: '#333333',
                        opacity: 0.5
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackTimeline;
