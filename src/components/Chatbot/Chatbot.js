import React, { useState } from 'react';
import { FaRobot, FaTimes, FaPaperPlane } from 'react-icons/fa';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: 'Hello! I\'m your health assistant. How can I help you today?', sender: 'bot' }
  ]);
  const [input, setInput] = useState('');

  const responses = {
    'temperature': 'Normal body temperature ranges from 36.1°C to 37.2°C. If your temperature is outside this range, please consult with your doctor.',
    'heart rate': 'A normal resting heart rate for adults ranges from 60 to 100 beats per minute. Athletes may have lower rates.',
    'spo2': 'Normal SpO₂ levels should be between 95% and 100%. Values below 90% require immediate medical attention.',
    'symptoms': 'Please describe your symptoms in detail. Common symptoms to monitor include fever, chest pain, shortness of breath, and irregular heartbeat.',
    'help': 'I can provide information about:\n- Temperature readings\n- Heart rate\n- SpO₂ levels\n- General health symptoms\n- When to contact your doctor',
    'default': 'I\'m here to help with health-related questions. You can ask about temperature, heart rate, SpO₂, or symptoms.'
  };

  const handleSend = () => {
    if (input.trim() === '') return;

    setMessages([...messages, { text: input, sender: 'user' }]);

    const lowerInput = input.toLowerCase();
    let response = responses.default;

    Object.keys(responses).forEach(key => {
      if (lowerInput.includes(key)) {
        response = responses[key];
      }
    });

    setTimeout(() => {
      setMessages(prev => [...prev, { text: response, sender: 'bot' }]);
    }, 500);

    setInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <>
      <div className={`chatbot-icon ${isOpen ? 'hidden' : ''}`} onClick={() => setIsOpen(true)}>
        <FaRobot size={30} />
      </div>

      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <div className="chatbot-title">
              <FaRobot /> Health Assistant
            </div>
            <button onClick={() => setIsOpen(false)} className="close-button">
              <FaTimes />
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                <p>{msg.text}</p>
              </div>
            ))}
          </div>

          <div className="chatbot-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
            />
            <button onClick={handleSend}>
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
