import React, { useState } from 'react';
import axios from 'axios';

function Chatbot() {
    const [userInput, setUserInput] = useState('');
    const [conversation, setConversation] = useState([]);
    const [isLoading, setIsLoading] = useState(false); 

    const handleInput = e => setUserInput(e.target.value);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userInput.trim()) return; 

        const newConversation = [...conversation, { text: userInput, isUser: true }];
        setConversation(newConversation);  
        setIsLoading(true); 

        try {
            const { data } = await axios.post('http://localhost:4000/api/chatbot/progress', {
                question: userInput,
                convHistory: conversation.filter(conv => !conv.isUser).map(conv => conv.text)
            });
            setConversation(convs => [...convs, { text: data.message, isUser: false }]); // Update with bot response
        } catch (error) {
            console.error(error);
            setConversation(convs => [...convs, { text: 'Error processing your request.', isUser: false }]);
        }
        setIsLoading(false); 
        setUserInput(''); 
    };

    return (
        <div className="chatbot">
            <div className="chatbot-header">
                <h1>F1-Advisor</h1>
            </div>
            <div className="messages">
                {conversation.map((line, index) => (
                    <div key={index} className={`message ${line.isUser ? 'user' : 'bot'}`}>
                        {line.text}
                    </div>
                ))}
                {isLoading && <div className="message bot">Loading...</div>}
            </div>
            <form className="message-form" onSubmit={handleSubmit}>
                <input 
                    type="text"
                    value={userInput}
                    onChange={handleInput}
                    placeholder="Type a message..."
                    autoFocus
                    disabled={isLoading} 
                />
                <button type="submit" disabled={isLoading}>Send</button>
            </form>
        </div>
    );
}

export default Chatbot;
