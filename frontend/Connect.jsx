import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Send } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const WS_URL = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');

const Connect = ({ user, setUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [ws, setWs] = useState(null);
  const messagesEndRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    // Initialize WebSocket connection
    if (user) {
      const websocket = new WebSocket(`${WS_URL}/ws/${user.id}`);
      
      websocket.onopen = () => {
        console.log('WebSocket connected');
      };
      
      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'new_message') {
          setMessages(prev => [...prev, data.message]);
        }
      };
      
      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      websocket.onclose = () => {
        console.log('WebSocket disconnected');
      };
      
      setWs(websocket);
      
      return () => {
        if (websocket.readyState === WebSocket.OPEN) {
          websocket.close();
        }
      };
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      searchTimeoutRef.current = setTimeout(() => {
        searchUsers(searchQuery);
      }, 300);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const searchUsers = async (query) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/users/search?q=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const selectUser = async (selectedUser) => {
    setSelectedUser(selectedUser);
    setSearchQuery('');
    setSearchResults([]);
    
    // Fetch chat history
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/messages/${selectedUser.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
    } catch (error) {
      toast.error('Failed to load messages');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedUser) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${BACKEND_URL}/api/messages`,
        {
          receiver_id: selectedUser.id,
          message: newMessage
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Layout user={user} setUser={setUser}>
      <div className="h-screen lg:h-[calc(100vh-0px)] flex flex-col" data-testid="connect-page">
        <div className="p-6 lg:p-8 bg-white shadow-md">
          <h1 className="text-4xl font-bold text-blue-900 mb-4" data-testid="connect-heading">Connect with Alumni</h1>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or company..."
              className="pl-10 py-6 text-base"
              data-testid="search-input"
            />
            
            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-xl border max-h-96 overflow-y-auto" data-testid="search-results">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => selectUser(result)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-blue-50 transition-colors border-b last:border-b-0"
                    data-testid={`search-result-${result.id}`}
                  >
                    <img
                      src={result.profile_picture}
                      alt={result.full_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">{result.full_name}</p>
                      <p className="text-sm text-gray-600">Batch of {result.passout_year} • {result.current_company}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        {selectedUser ? (
          <div className="flex-1 flex flex-col bg-white m-6 lg:m-8 rounded-2xl shadow-xl overflow-hidden" data-testid="chat-window">
            {/* Chat Header */}
            <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center gap-4">
              <div className="relative">
                <img
                  src={selectedUser.profile_picture}
                  alt={selectedUser.full_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" data-testid="online-status"></div>
              </div>
              <div>
                <p className="font-semibold text-lg">{selectedUser.full_name}</p>
                <p className="text-sm text-blue-100">Batch of {selectedUser.passout_year} • {selectedUser.current_company}</p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" data-testid="messages-area">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                    data-testid={`message-${msg.id}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                        msg.sender_id === user.id
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                          : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                      }`}
                    >
                      <p className="text-sm break-words">{msg.message}</p>
                      <p className="text-xs mt-1 opacity-75">{formatTimestamp(msg.timestamp)}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="p-4 bg-gray-50 border-t" data-testid="message-form">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 py-6"
                  data-testid="message-input"
                />
                <Button
                  type="submit"
                  className="px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  data-testid="send-button"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center" data-testid="no-chat-selected">
            <div className="text-center text-gray-500">
              <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">Search for an alumni to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Connect;