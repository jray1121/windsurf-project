// Audio analysis utilities
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

/**
 * Analyzes an audio file to detect beats using onset detection
 * @param {Blob} audioBlob - The audio file to analyze
 * @param {Object} songInfo - Information about the song (time signature, beat value)
 * @returns {Promise<{beats: Array<number>, bpm: number}>} Array of beat timestamps and detected BPM
 */
export const analyzeBeats = async (audioBlob, songInfo) => {
  try {
    // Convert blob to array buffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    
    // Decode the audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Get the raw audio data
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Parameters for analysis
    const hopSize = 128; // Number of samples between analyses
    const bufferSize = 2048; // Size of analysis buffer
    
    // Arrays to store our analysis results
    const beats = [];
    let energyHistory = [];
    const energyThreshold = 0.8; // Adjust this based on your click track
    
    // Process the audio in chunks
    for (let i = 0; i < channelData.length - bufferSize; i += hopSize) {
      // Get current chunk
      const chunk = channelData.slice(i, i + bufferSize);
      
      // Calculate RMS energy
      const energy = Math.sqrt(chunk.reduce((acc, val) => acc + val * val, 0) / bufferSize);
      
      // Store energy value
      energyHistory.push(energy);
      
      // Keep history length reasonable
      if (energyHistory.length > 43) { // About 1 second of history at 44.1kHz
        energyHistory.shift();
      }
      
      // Calculate local energy average
      const localAverage = energyHistory.reduce((a, b) => a + b, 0) / energyHistory.length;
      
      // Detect onset if energy rises significantly above local average
      if (energy > localAverage * energyThreshold && 
          (beats.length === 0 || (i / sampleRate - beats[beats.length - 1]) > 0.1)) { // Minimum 100ms between beats
        beats.push(i / sampleRate);
      }
    }
    
    // Calculate average BPM
    if (beats.length > 1) {
      const intervals = [];
      for (let i = 1; i < beats.length; i++) {
        intervals.push(beats[i] - beats[i - 1]);
      }
      
      // Calculate median interval for more robust BPM detection
      intervals.sort((a, b) => a - b);
      const medianInterval = intervals[Math.floor(intervals.length / 2)];
      const bpm = Math.round(60 / medianInterval);
      
      console.log('Analysis results:', {
        timeSignature: songInfo.timeSignature,
        beatValue: songInfo.beatValue,
        detectedBpm: bpm,
        numberOfBeats: beats.length
      });
      
      return {
        beats,
        bpm,
        beatInterval: medianInterval
      };
    }
    
    throw new Error('Could not detect enough beats in the audio');
  } catch (error) {
    console.error('Error analyzing audio:', error);
    throw error;
  }
};

/**
 * Maps detected beats to measures based on time signature
 * @param {Array<number>} beats - Array of beat timestamps
 * @param {string} timeSignature - Time signature (e.g., "4/4")
 * @param {number} bpm - Detected BPM
 * @returns {Array<{measure: number, beat: number, time: number}>}
 */
export const mapBeatsToMeasures = (beats, timeSignature, bpm) => {
  const [beatsPerMeasure] = timeSignature.split('/').map(Number);
  
  return beats.map((time, index) => {
    const totalBeats = index;
    const measure = Math.floor(totalBeats / beatsPerMeasure) + 1;
    const beat = (totalBeats % beatsPerMeasure) + 1;
    
    return {
      measure,
      beat,
      time
    };
  });
};
