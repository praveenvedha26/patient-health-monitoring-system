import React, { useState, useEffect, useRef } from 'react';
import { FaRobot, FaTimes, FaPaperPlane } from 'react-icons/fa';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      text: 'Hello! 👋 I\'m your friendly health assistant. I\'m here to help answer your health-related questions and provide information about your vital signs. How are you feeling today?',
      sender: 'bot'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const systemPrompt = `You are a compassionate and professional healthcare assistant chatbot for a patient health monitoring system. Your responsibilities:

Communication Style:
- Use a warm, empathetic, and supportive tone while maintaining professionalism
- Address patients respectfully and show genuine care for their concerns
- Use simple, clear language - avoid complex medical jargon unless explaining it
- Keep responses concise (2-4 sentences) unless detailed explanation is warranted

Core Functions:
1. Provide accurate information about vital signs:
   - Body Temperature: Normal range 36.1°C - 37.2°C (97°F - 99°F)
   - Resting Heart Rate: 60-100 bpm for adults
   - SpO2 Levels: 95-100% normal (below 90% needs immediate attention)
   - Blood Pressure: 120/80 mmHg is optimal

2. Help patients understand their health readings
3. Identify when medical attention is needed
4. Offer general wellness advice and symptom guidance

Important Guidelines:
- ALWAYS remind users you're not a replacement for professional medical advice
- For serious symptoms, urgent conditions, or values outside normal ranges, advise consulting a healthcare professional immediately
- Show empathy when patients express health concerns
- Never diagnose conditions - only provide educational information
- Respect patient confidentiality

Emergency Indicators (advise immediate medical attention):
- SpO2 below 90%
- Severe chest pain or breathing difficulty
- Temperature above 39.4°C (103°F) or below 35°C (95°F)
- Heart rate consistently above 120 or below 50 bpm at rest
- Any symptoms of stroke, heart attack, or severe allergic reaction

Be supportive, never dismissive, and always prioritize patient safety.`;

  const fetchGeminiResponse = async (promptText) => {
    const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    const body = {
      contents: [{
        parts: [{
          text: promptText
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Unable to generate response.");
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";
  };

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
    setInput('');
    setIsLoading(true);

    try {
      const conversationHistory = messages
        .slice(-6)
        .map(msg => `${msg.sender === 'user' ? 'Patient' : 'Assistant'}: ${msg.text}`)
        .join('\n');

      const fullPrompt = `${systemPrompt}

Previous Conversation:
${conversationHistory}

Current Patient Query:
${userMessage}

Your Response:`;

      const botResponse = await fetchGeminiResponse(fullPrompt);

      setMessages(prev => [...prev, { text: botResponse, sender: 'bot' }]);
    } catch (error) {
      setMessages(prev => [...prev, { text: "⚠️ Error: " + error.message, sender: 'bot' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        text: 'Hello! 👋 I\'m your friendly health assistant. I\'m here to help answer your health-related questions and provide information about your vital signs. How are you feeling today?',
        sender: 'bot'
      }
    ]);
    setInput('');
    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chatbot Icon */}
      <div 
        className={`chatbot-icon ${isOpen ? 'hidden' : ''}`} 
        onClick={() => setIsOpen(true)} 
        title="Chat with Health Assistant"
      >
        <FaRobot size={30} />
      </div>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <div className="chatbot-title">
              <FaRobot /> Health Assistant
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="close-button" 
              aria-label="Close chat"
            >
              <FaTimes />
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                <p>{msg.text}</p>
              </div>
            ))}
            {isLoading && (
              <div className="message bot">
                <p className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your health question..."
              disabled={isLoading}
              aria-label="Message input"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || input.trim() === ''}
              aria-label="Send message"
            >
              <FaPaperPlane />
            </button>

            {/* Clear button added here */}
            <button
              onClick={handleClear}
              disabled={isLoading}
              aria-label="Clear chat"
              style={{
                marginLeft: 10,
                padding: '8px 16px',
                backgroundColor: '#FF4D4F',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Clear
            </button>

          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
