import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  MusicNote as MusicNoteIcon
} from '@mui/icons-material';

const SongList = () => {
  // Mock data - replace with actual API call
  const [songs, setSongs] = useState([
    {
      id: 1,
      title: 'Amazing Grace',
      tracks: [
        { id: 1, type: 'click', label: 'Click Track', duration: '3:45' },
        { id: 2, type: 'piano', label: 'Piano Track', duration: '3:45' },
        { id: 3, type: 'soprano_1', label: 'Soprano 1', duration: '3:45' },
        { id: 4, type: 'alto_1', label: 'Alto 1', duration: '3:45' }
      ],
      uploadedAt: '2025-04-23'
    },
    {
      id: 2,
      title: 'Hallelujah',
      tracks: [
        { id: 5, type: 'click', label: 'Click Track', duration: '4:20' },
        { id: 6, type: 'piano', label: 'Piano Track', duration: '4:20' },
        { id: 7, type: 'all_vocals', label: 'All Vocals', duration: '4:20' }
      ],
      uploadedAt: '2025-04-23'
    }
  ]);

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedSong, setSelectedSong] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleMenuOpen = (event, song) => {
    setAnchorEl(event.currentTarget);
    setSelectedSong(song);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    setEditName(selectedSong.title);
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleEditSave = () => {
    if (editName.trim()) {
      setSongs(songs.map(song =>
        song.id === selectedSong.id
          ? { ...song, title: editName }
          : song
      ));
      setEditDialogOpen(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = () => {
    setSongs(songs.filter(song => song.id !== selectedSong.id));
    setDeleteDialogOpen(false);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Uploaded Songs
        </Typography>

        <Box sx={{ mt: 2 }}>
          {songs.map((song) => (
            <Accordion key={song.id} sx={{ mb: 2 }}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  '& .MuiAccordionSummary-content': {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }
                }}
              >
                <Typography variant="h6">{song.title}</Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    {song.tracks.length} tracks • {song.uploadedAt}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuOpen(e, song);
                    }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {song.tracks.map((track) => (
                    <ListItem
                      key={track.id}
                      sx={{
                        borderLeft: 2,
                        borderColor: 'primary.main',
                        pl: 2,
                        mb: 1,
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                      }}
                    >
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <MusicNoteIcon fontSize="small" />
                            <Typography>{track.label}</Typography>
                            <Chip
                              label={track.duration}
                              size="small"
                              variant="outlined"
                            />
                          </Stack>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" size="small">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEditClick}>
            <EditIcon sx={{ mr: 1 }} /> Edit
          </MenuItem>
          <MenuItem onClick={handleDeleteClick}>
            <DeleteIcon sx={{ mr: 1 }} /> Delete
          </MenuItem>
        </Menu>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
          <DialogTitle>Edit Song</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Song Name"
              type="text"
              fullWidth
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSave} variant="contained">Save</Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Song</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{selectedSong?.title}" and all its tracks?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default SongList;
