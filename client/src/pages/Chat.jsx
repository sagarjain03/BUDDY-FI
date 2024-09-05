import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

// Connect to the backend socket server
const socket = io('http://localhost:5000'); // Your backend URL

const Chat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Listen for messages from the server
    socket.on('receiveMessage', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Cleanup when the component unmounts
    return () => {
      socket.off('receiveMessage');
    };
  }, []);

  // Handle sending message
  const sendMessage = () => {
    if (message.trim()) {
      socket.emit('sendMessage', message);
      setMessage(''); // Clear the input field after sending
    }
  };

  return (
    <div>
      <h2>Chat</h2>
      <div>
        {messages.map((msg, index) => (
          <div key={index}>{msg}</div>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default Chat;
