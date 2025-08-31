import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import axios from 'axios';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  
  const { user, logout } = useAuth();

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:9000');
    setSocket(newSocket);

    // Join the chat
    newSocket.emit('join', { username: user.username });

    // Listen for new messages
    newSocket.on('newMessage', (messageData) => {
      setMessages((prevMessages) => [...prevMessages, messageData]);
    });

    // Load existing messages
    const loadMessages = async () => {
      try {
        const res = await axios.get('http://localhost:9000/api/messages');
        setMessages(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading messages:', err);
        setLoading(false);
      }
    };

    loadMessages();

    // Cleanup
    return () => {
      newSocket.close();
    };
  }, [user.username]);

  const sendMessage = (e) => {
    e.preventDefault();
    
    if (message.trim() && socket) {
      if (message.length > 500) {
        alert('Message too long. Maximum 500 characters.');
        return;
      }

      socket.emit('sendMessage', {
        content: message.trim(),
        sender: user.username
      });
      
      setMessage('');
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="chat-container">
        <div className="loading">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Global Chat</h2>
        <div className="user-info">
          <span>Welcome, {user.username}!</span>
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={`message ${msg.sender === user.username ? 'own-message' : ''}`}
            >
              <div className="message-header">
                <span className="sender">{msg.sender}</span>
                <span className="timestamp">{formatTime(msg.timestamp)}</span>
              </div>
              <div className="message-content">{msg.content}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="message-form">
        <div className="input-container">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            maxLength="500"
            required
          />
          <button type="submit" disabled={!message.trim()}>
            Send
          </button>
        </div>
        <div className="char-count">
          {message.length}/500 characters
        </div>
      </form>
    </div>
  );
};

export default Chat;