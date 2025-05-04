import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  MenuItem,
  Select,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const commonTimeSignatures = [
  "2/4", "3/4", "4/4", "5/4", "6/4", "7/4",
  "3/8", "6/8", "9/8", "12/8",
  "2/2", "3/2", "4/2"
];

const SongForm = ({ onSubmit, initialData = {} }) => {
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    timeSignature: initialData.timeSignature || '4/4',
    timeSignatureChanges: initialData.timeSignatureChanges || [],
    // Preserve existing fields
    tracks: initialData.tracks || [],
    bpm: initialData.bpm || '',
    key: initialData.key || '',
    voicings: initialData.voicings || []
  });

  const [customTimeSignature, setCustomTimeSignature] = useState({
    beats: '',
    beatType: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addTimeSignatureChange = () => {
    setFormData(prev => ({
      ...prev,
      timeSignatureChanges: [
        ...prev.timeSignatureChanges,
        { measure: '', timeSignature: '4/4' }
      ]
    }));
  };

  const updateTimeSignatureChange = (index, field, value) => {
    setFormData(prev => {
      const newChanges = [...prev.timeSignatureChanges];
      newChanges[index] = {
        ...newChanges[index],
        [field]: field === 'measure' ? parseInt(value, 10) : value
      };
      // Sort by measure number and remove any invalid entries
      return {
        ...prev,
        timeSignatureChanges: newChanges
          .filter(change => change.measure && change.timeSignature)
          .sort((a, b) => a.measure - b.measure)
      };
    });
  };

  const removeTimeSignatureChange = (index) => {
    setFormData(prev => ({
      ...prev,
      timeSignatureChanges: prev.timeSignatureChanges.filter((_, i) => i !== index)
    }));
  };

  const handleCustomTimeSignature = (index) => {
    if (customTimeSignature.beats && customTimeSignature.beatType) {
      const newTimeSignature = `${customTimeSignature.beats}/${customTimeSignature.beatType}`;
      if (index === -1) {
        // For initial time signature
        setFormData(prev => ({
          ...prev,
          timeSignature: newTimeSignature
        }));
      } else {
        // For time signature changes
        updateTimeSignatureChange(index, 'timeSignature', newTimeSignature);
      }
      setCustomTimeSignature({ beats: '', beatType: '' });
    }
  };

  const validateMeasureNumber = (value, index) => {
    const measureNum = parseInt(value, 10);
    if (isNaN(measureNum) || measureNum < 1) return false;
    
    // Check for duplicate measure numbers
    return !formData.timeSignatureChanges.some(
      (change, i) => i !== index && change.measure === measureNum
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Filter out any invalid time signature changes before submitting
    const validChanges = formData.timeSignatureChanges
      .filter(change => change.measure && change.timeSignature)
      .sort((a, b) => a.measure - b.measure);
    
    onSubmit({
      ...formData,
      timeSignatureChanges: validChanges
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 800, margin: 'auto', p: 3 }}>
      {/* Preserve existing form fields */}
      <TextField
        fullWidth
        label="Title"
        name="title"
        value={formData.title}
        onChange={handleInputChange}
        margin="normal"
        required
      />

      <Box sx={{ mt: 3, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Initial Time Signature
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Select
            value={formData.timeSignature}
            onChange={(e) => handleInputChange({
              target: { name: 'timeSignature', value: e.target.value }
            })}
            sx={{ minWidth: 100 }}
          >
            {commonTimeSignatures.map(ts => (
              <MenuItem key={ts} value={ts}>{ts}</MenuItem>
            ))}
            <MenuItem value="custom">Custom...</MenuItem>
          </Select>

          {formData.timeSignature === 'custom' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                label="Beats"
                type="number"
                value={customTimeSignature.beats}
                onChange={(e) => setCustomTimeSignature(prev => ({
                  ...prev,
                  beats: e.target.value
                }))}
                sx={{ width: 80 }}
                inputProps={{ min: 1 }}
              />
              <Typography>/</Typography>
              <TextField
                label="Beat Type"
                type="number"
                value={customTimeSignature.beatType}
                onChange={(e) => setCustomTimeSignature(prev => ({
                  ...prev,
                  beatType: e.target.value
                }))}
                sx={{ width: 80 }}
                inputProps={{ min: 1 }}
              />
              <Button
                variant="contained"
                onClick={() => handleCustomTimeSignature(-1)}
                disabled={!customTimeSignature.beats || !customTimeSignature.beatType}
              >
                Apply
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Time Signature Changes
          </Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={addTimeSignatureChange}
            variant="contained"
          >
            Add Change
          </Button>
        </Box>

        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Measure Number</TableCell>
                <TableCell>New Time Signature</TableCell>
                <TableCell width={100}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {formData.timeSignatureChanges.map((change, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <TextField
                      type="number"
                      value={change.measure}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        if (validateMeasureNumber(newValue, index)) {
                          updateTimeSignatureChange(index, 'measure', newValue);
                        }
                      }}
                      inputProps={{ min: 1 }}
                      error={!validateMeasureNumber(change.measure, index)}
                      helperText={!validateMeasureNumber(change.measure, index) ? 'Invalid or duplicate measure number' : ''}
                      fullWidth
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Select
                        value={change.timeSignature}
                        onChange={(e) => updateTimeSignatureChange(index, 'timeSignature', e.target.value)}
                        sx={{ minWidth: 100 }}
                      >
                        {commonTimeSignatures.map(ts => (
                          <MenuItem key={ts} value={ts}>{ts}</MenuItem>
                        ))}
                        <MenuItem value="custom">Custom...</MenuItem>
                      </Select>

                      {change.timeSignature === 'custom' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TextField
                            label="Beats"
                            type="number"
                            value={customTimeSignature.beats}
                            onChange={(e) => setCustomTimeSignature(prev => ({
                              ...prev,
                              beats: e.target.value
                            }))}
                            sx={{ width: 80 }}
                            inputProps={{ min: 1 }}
                          />
                          <Typography>/</Typography>
                          <TextField
                            label="Beat Type"
                            type="number"
                            value={customTimeSignature.beatType}
                            onChange={(e) => setCustomTimeSignature(prev => ({
                              ...prev,
                              beatType: e.target.value
                            }))}
                            sx={{ width: 80 }}
                            inputProps={{ min: 1 }}
                          />
                          <Button
                            variant="contained"
                            onClick={() => handleCustomTimeSignature(index)}
                            disabled={!customTimeSignature.beats || !customTimeSignature.beatType}
                          >
                            Apply
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => removeTimeSignatureChange(index)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {formData.timeSignatureChanges.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <Typography color="textSecondary">
                      No time signature changes
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Preserve any other existing form fields */}

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
        >
          Save Song
        </Button>
      </Box>
    </Box>
  );
};

export default SongForm;
