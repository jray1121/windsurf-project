import React from 'react';
import { Typography } from '@mui/material';
import TrackControls from './TrackControls';

const CONTAINER_WIDTH = 800; // Width of the container
const EXTRA_MEASURE_PERCENT = 0.15; // Show 15% of the next measure
const TIMELINE_HEIGHT = 40;
const HEADER_WIDTH = 200;

// Time signature positioning
const TIME_SIGNATURE_X_OFFSET = 4; // pixels from measure start
const TIME_SIGNATURE_Y_POSITION = (TIMELINE_HEIGHT * 0.58) - 3; // pixels from top

// Format track name from snake_case to Title Case
export const formatTrackName = (name) => {
  if (!name) return 'Untitled Track';
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Calculate pixel position for a given time considering tempo and time signatures
const getPixelPositionFromTime = (currentTime = 0, measures = [], beatMap = [], visibleMeasures = 8) => {
  if (!measures.length || !beatMap?.length) return 0;
  
  // Find the beats before and after current time
  let currentBeatIndex = -1;
  for (let i = 0; i < beatMap.length; i++) {
    if (beatMap[i].time > currentTime) {
      currentBeatIndex = Math.max(0, i - 1);
      break;
    }
  }
  if (currentBeatIndex === -1) currentBeatIndex = beatMap.length - 1;

  const currentBeat = beatMap[currentBeatIndex];
  const nextBeat = beatMap[currentBeatIndex + 1];
  
  if (!currentBeat) return 0;
  
  // Find the measures for current and next beat
  const currentMeasure = measures.find(m => m.number === currentBeat.measure);
  const nextMeasure = nextBeat ? measures.find(m => m.number === nextBeat.measure) : currentMeasure;
  if (!currentMeasure) return 0;
  
  // Calculate the progress between beats
  const progress = nextBeat ? 
    (currentTime - currentBeat.time) / (nextBeat.time - currentBeat.time) : 
    0;
  
  // Calculate positions for current and next beat
  const currentBeatWidth = currentMeasure.width / currentBeat.beatsInMeasure;
  const currentPosition = currentMeasure.startTime + (currentBeat.beat - 1) * currentBeatWidth;
  
  let nextPosition;
  if (nextBeat) {
    if (nextBeat.measure === currentBeat.measure) {
      // Next beat is in same measure
      nextPosition = currentMeasure.startTime + (nextBeat.beat - 1) * currentBeatWidth;
    } else {
      // Next beat is in next measure
      const nextBeatWidth = nextMeasure.width / nextBeat.beatsInMeasure;
      nextPosition = nextMeasure.startTime + (nextBeat.beat - 1) * nextBeatWidth;
    }
  } else {
    // No next beat, use end of current measure
    nextPosition = currentMeasure.startTime + currentMeasure.width;
  }
  
  // Interpolate between positions for smooth movement
  const position = currentPosition + (nextPosition - currentPosition) * progress;
  
  // Calculate position relative to measure start
  const relativePosition = position - currentMeasure.startTime;
  
  // Ensure we don't exceed measure width
  return currentMeasure.startTime + Math.min(relativePosition, currentMeasure.width);
};

const getMeasuresFromBeatMap = (beatMap, timeSignatureChanges = [], visibleMeasures = 8) => {
  if (!beatMap || !beatMap.length) return [];
  
  // Get the last beat to determine total measures
  const lastBeat = beatMap[beatMap.length - 1];
  const totalMeasures = lastBeat.measure;
  
  // Calculate measure width to fit exactly the number of measures requested plus a bit extra
  const measureWidth = (CONTAINER_WIDTH / (visibleMeasures + EXTRA_MEASURE_PERCENT)) * 2; // Show a bit of the next measure
  const PIXELS_PER_BEAT = measureWidth / 4; // 4 beats per measure
  
  // Keep track of cumulative position
  let currentPosition = 0;
  
  // Create array of measures
  return Array.from({ length: totalMeasures }, (_, i) => {
    const measureNumber = i + 1;
    const measureStart = currentPosition;
    
    // Find time signature for this measure
    const timeSignatureChange = timeSignatureChanges.find(change => change.measure === measureNumber);
    let [beatsPerMeasure, beatType] = timeSignatureChange ? 
      timeSignatureChange.timeSignature.split('/').map(Number) : 
      [4, 4]; // Default to 4/4
    
    // Calculate beat width based on beat type (4 = quarter note, 8 = eighth note, etc)
    const beatWidth = PIXELS_PER_BEAT * (4/beatType);
    const measureWidth = beatWidth * beatsPerMeasure;
    
    // Create beat lines (excluding beat 1 which is the measure line)
    const beats = Array.from({ length: beatsPerMeasure - 1 }, (_, beatIndex) => ({
      number: beatIndex + 2,
      startTime: measureStart + ((beatIndex + 1) * beatWidth)
    }));
    
    // Update position for next measure
    currentPosition += measureWidth;

    return {
      number: measureNumber,
      startTime: measureStart,
      beats,
      width: measureWidth
    };
  });
};

const TimelineRuler = ({ beatMap, currentTime, totalWidth, timeSignatureChanges, visibleMeasures = 8 }) => {
  const measures = getMeasuresFromBeatMap(beatMap, timeSignatureChanges, visibleMeasures);
  const currentPosition = getPixelPositionFromTime(currentTime, measures, beatMap, visibleMeasures);
  
  // Get current tempo from beatMap
  const currentBeat = beatMap?.find(beat => beat.time > currentTime) || beatMap?.[0] || { tempo: 0 };
  
  // Get current beat info from beatMap
  const currentBeatInfo = beatMap?.find((beat, index) => {
    const nextBeat = beatMap[index + 1];
    return currentTime >= beat.time && (!nextBeat || currentTime < nextBeat.time);
  }) || { measure: 1, beat: 1, beatsInMeasure: 4 };

  // Calculate total measures from beatMap
  const totalMeasures = beatMap ? beatMap[beatMap.length - 1].measure : 16;

  // Calculate timeline width based on measures
  const totalTimelineWidth = measures.reduce((sum, measure) => sum + measure.width, 0);
  const minWidth = Math.max(totalWidth || window.innerWidth - HEADER_WIDTH, totalTimelineWidth);
  
  return (
    <div 
      style={{
        position: 'relative',
        height: TIMELINE_HEIGHT,
        backgroundColor: '#000000',
        borderTop: '1px solid #666666',
        borderBottom: '1px solid #666666',
        width: minWidth,
        zIndex: 10,
        overflow: 'hidden'
      }}
    >
      <div style={{
        position: 'relative',
        height: '100%',
        width: '100%'
      }}>
        {/* Middle divider line */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: TIMELINE_HEIGHT / 2,
          width: '100%',
          height: 1,
          backgroundColor: '#333333',
          zIndex: 1
        }} />
        {measures.map((measure) => (
          <React.Fragment key={measure.number}>
            {/* Measure number */}
            <div 
              style={{
                position: 'absolute',
                left: measure.startTime + 2,
                top: 2,
                color: '#666666',
                fontSize: '0.75rem',
                fontFamily: 'monospace'
              }}
            >
              {measure.number}
            </div>

            {/* Time signature if first measure or if changed */}
            {(measure.number === 1 || timeSignatureChanges?.some(change => change.measure === measure.number)) && (
              <div 
                style={{
                  position: 'absolute',
                  left: measure.startTime + 2,
                  top: TIMELINE_HEIGHT / 2,
                  color: '#666666',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace'
                }}
              >
                {measure.number === 1 ? '4/4' : 
                  timeSignatureChanges
                    ?.find(change => change.measure === measure.number)?.timeSignature}
              </div>
            )}

            {/* Measure line */}
            <div
              style={{
                position: 'absolute',
                left: measure.startTime,
                top: 0,
                width: 1,
                height: '100%',
                backgroundColor: '#666666'
              }}
            />

            {/* Beat lines */}
            {measure.beats.map(beat => (
              <div
                key={`beat-${measure.number}-${beat.number}`}
                style={{
                  position: 'absolute',
                  left: beat.startTime,
                  top: 0,
                  width: 1,
                  height: TIMELINE_HEIGHT / 2,
                  backgroundColor: '#333333'
                }}
              />
            ))}
          </React.Fragment>
        ))}

        {/* Playhead */}
        <div
          style={{
            position: 'absolute',
            left: currentPosition,
            top: 0,
            width: 2,
            height: '100%',
            backgroundColor: '#ff0000',
            zIndex: 100
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
  width, 
  onMute, 
  onSolo,
  onVolumeChange = () => {},
  onPanChange = () => {},
  timeSignatureChanges = [
    { measure: 1, timeSignature: '4/4' },
    { measure: 5, timeSignature: '3/4' },
    { measure: 9, timeSignature: '6/8' }
  ],
  visibleMeasures = 8
}) => {
  const containerRef = React.useRef(null);
  const measures = getMeasuresFromBeatMap(beatMap, timeSignatureChanges, visibleMeasures);
  const totalWidth = measures.reduce((sum, measure) => sum + measure.width, 0);
  const totalTimelineWidth = totalWidth; // Total width based on all measures
  const measureWidth = (CONTAINER_WIDTH / visibleMeasures) * 1.1; // Add 10% to show a bit of the next measure
  const minWidth = Math.max(width || window.innerWidth - HEADER_WIDTH, totalTimelineWidth);
  
  // Calculate total measures from beatMap
  const totalMeasures = beatMap ? beatMap[beatMap.length - 1].measure : 16;

  // Auto-scroll to keep playhead in view
  React.useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      const playheadPosition = getPixelPositionFromTime(currentTime, measures, beatMap, visibleMeasures);
      const containerWidth = container.clientWidth;
      const currentScroll = container.scrollLeft;

      // Check if playhead is outside visible area
      if (playheadPosition < currentScroll || playheadPosition > currentScroll + containerWidth) {
        container.scrollLeft = Math.max(0, playheadPosition - containerWidth / 2);
      }
    }
  }, [currentTime, measures, beatMap, visibleMeasures]);

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      backgroundColor: '#000000'
    }}>
      {/* Fixed header column */}
      <div style={{
        width: HEADER_WIDTH,
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
        <TimelineRuler 
          beatMap={beatMap} 
          currentTime={currentTime} 
          totalWidth={width} 
          timeSignatureChanges={timeSignatureChanges}
          visibleMeasures={visibleMeasures}
        />

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
                width: totalTimelineWidth + measureWidth,
                minWidth: minWidth,
                zIndex: 10
              }}
            >
              {/* Grid lines */}
              <div style={{
                width: totalTimelineWidth + measureWidth,
                minWidth: minWidth,
                height: '100%',
                position: 'relative',
                backgroundColor: '#000000',
                zIndex: 10
              }}>
                {/* Measure grid lines */}
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
                {/* Beat grid lines */}
                {measures.map(measure => 
                  measure.beats.map(beat => (
                    <div
                      key={`grid-beat-${measure.number}-${beat.number}`}
                      style={{
                        position: 'absolute',
                        left: beat.startTime,
                        top: 0,
                        height: '100%',
                        width: 1,
                        backgroundColor: '#333333',
                        opacity: 0.25
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrackTimeline;
