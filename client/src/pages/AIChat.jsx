import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { API_BASE_URL } from '../config';

function AIChat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');

  // Generate a random session ID when component mounts
  useEffect(() => {
    const newSessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setSessionId(newSessionId);
  }, []);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setLoading(true);

    // Add user message to chat
    const updatedMessages = [...messages, { role: 'user', content: userMessage, timestamp: new Date() }];
    setMessages(updatedMessages);

    try {
      const response = await axios.post(`${API_BASE_URL}/ai-chat`, {
        message: userMessage,
        sessionId: sessionId
      });

      // Add assistant response to chat
      setMessages([...updatedMessages, {
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message to chat
      setMessages([...updatedMessages, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Chat with Jarvis
      </Typography>
      <Paper elevation={3} sx={{ p: 2, height: '70vh', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
          <List>
            {messages.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography variant="body1" color="textSecondary">
                  Start chatting with Jarvis by sending a message below
                </Typography>
              </Box>
            ) : (
              messages.map((msg, index) => (
                <Box key={index}>
                  <ListItem alignItems="flex-start" sx={{ 
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  }}>
                    <ListItemText
                      primary={msg.role === 'user' ? 'You' : 'Jarvis'}
                      secondary={msg.content}
                      secondaryTypographyProps={{
                        sx: { whiteSpace: 'pre-wrap' }
                      }}
                      sx={{
                        bgcolor: msg.role === 'user' ? 'primary.light' : 'grey.200',
                        p: 2,
                        borderRadius: 2,
                        maxWidth: '70%'
                      }}
                    />
                  </ListItem>
                  {index < messages.length - 1 && <Divider variant="middle" component="li" />}
                </Box>
              ))
            )}
          </List>
        </Box>
        <Box component="form" onSubmit={sendMessage} sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            label="Type your message"
            value={input}
            onChange={handleInputChange}
            variant="outlined"
            disabled={loading}
            sx={{ mr: 1 }}
          />
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            disabled={loading || !input.trim()} 
            endIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          >
            Send
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default AIChat;