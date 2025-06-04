const express = require('express');
const router = express.Router();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Store chat sessions in memory
// In a real application, this should be in a database
const chatSessions = {};

// POST endpoint to handle chat requests
router.post('/', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    
    // Validate request
    if (!message || !sessionId) {
      return res.status(400).json({ error: 'Message and sessionId are required' });
    }
    
    // Check if API key is available
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error('DEEPSEEK_API_KEY environment variable not set');
      return res.status(500).json({ error: 'API configuration error' });
    }
    
    // Initialize session if it doesn't exist
    if (!chatSessions[sessionId]) {
      chatSessions[sessionId] = [];
    }
    
    // Add user message to session history
    const timestamp = new Date();
    chatSessions[sessionId].push({
      role: 'user',
      content: message,
      timestamp
    });
    
    // System prompt is always included as the first message in each request
    const systemPrompt = {
      role: 'system',
      content: 'You are a helpful assistant named Jarvis. Never mention DeepSeek.'
    };
    
    // Prepare message history for DeepSeek API
    const messageHistory = [
      systemPrompt,
      ...chatSessions[sessionId].map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];
    
    // Send request to DeepSeek API
    const response = await axios.post(
      'https://api.deepseek.com/chat/completions',
      {
        model: 'deepseek-chat',
        messages: messageHistory,
        stream: false
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    
    // Extract assistant response
    const assistantResponse = response.data.choices[0].message.content;
    
    // Add assistant response to session history
    chatSessions[sessionId].push({
      role: 'assistant',
      content: assistantResponse,
      timestamp: new Date()
    });
    
    // Send response back to client
    res.status(200).json({
      message: assistantResponse
    });
    
  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

module.exports = router;