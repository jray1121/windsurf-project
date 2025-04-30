import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Drawer,
  IconButton,
  Divider,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const SongList = ({ open, onClose, songs = [], loading = false, onSongSelect }) => {
  // Group songs by voicing
  const songsByVoicing = songs.reduce((acc, song) => {
    if (!acc[song.voicing]) {
      acc[song.voicing] = [];
    }
    acc[song.voicing].push(song);
    return acc;
  }, {});

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: 320 }
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Song Library</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Divider />
      
      <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : songs.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No songs available.
              <br />
              Add songs using the admin app.
            </Typography>
          </Box>
        ) : (
          Object.entries(songsByVoicing).map(([voicing, songs]) => 
            songs.length > 0 && (
              <Box key={voicing} sx={{ mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    px: 2,
                    py: 1,
                    bgcolor: 'background.default',
                    color: 'primary.main',
                  }}
                >
                  {voicing.toUpperCase()}
                </Typography>
                
                <List dense disablePadding>
                  {songs.map((song) => (
                    <ListItem key={song.id} disablePadding>
                      <ListItemButton
                        onClick={() => {
                          onSongSelect(song);
                          onClose();
                        }}
                      >
                        <ListItemText
                          primary={song.title}
                          secondary={`${song.tracks.length} track${song.tracks.length !== 1 ? 's' : ''}`}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )
          )
        )}
      </Box>
    </Drawer>
  );
};

export default SongList;
