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
  TextField
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const SongList = () => {
  // Mock data - replace with actual API call
  const [songs, setSongs] = useState([
    { id: 1, name: 'Demo Song 1', duration: '3:45', uploadedAt: '2025-04-23' },
    { id: 2, name: 'Demo Song 2', duration: '4:20', uploadedAt: '2025-04-23' }
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
    setEditName(selectedSong.name);
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleEditSave = () => {
    if (editName.trim()) {
      setSongs(songs.map(song =>
        song.id === selectedSong.id
          ? { ...song, name: editName }
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

        <List>
          {songs.map((song) => (
            <ListItem
              key={song.id}
              divider
              secondaryAction={
                <IconButton edge="end" onClick={(e) => handleMenuOpen(e, song)}>
                  <MoreVertIcon />
                </IconButton>
              }
            >
              <ListItemText
                primary={song.name}
                secondary={`Duration: ${song.duration} • Uploaded: ${song.uploadedAt}`}
              />
            </ListItem>
          ))}
        </List>

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
              Are you sure you want to delete "{selectedSong?.name}"?
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
