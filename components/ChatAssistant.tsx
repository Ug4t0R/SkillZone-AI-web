
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Bot, Terminal, AlertTriangle, Activity } from 'lucide-react';
import { sendMessageToGemini } from '../services/geminiService';
import { ChatMessage } from '../types';
import { saveChatToHistory, getUserProfile, saveUserProfile, detectUserIdentity, getDailyMessageCount, isAiLimitReached, refreshMessageCount, updateUserMemory } from '../utils/devTools';

interface ChatAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [welcomeLoaded, setWelcomeLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load personalized welcome message
  useEffect(() => {
    if (isOpen && !welcomeLoaded) {
      getUserProfile().then(profile => {
        let greeting: string;
        if (profile.nickname && profile.interactionCount > 1) {
          // Returning user with known name
          if (profile.conversationSummary) {
            greeting = `Yo ${profile.nickname}! Zase ty? 🎮`;
          } else {
            greeting = `Čau ${profile.nickname}! Co je novýho? 🎮`;
          }
        } else if (profile.interactionCount > 1) {
          greeting = 'Hele, tebe už znám! Co řešíš? 🎮';
        } else {
          greeting = 'cs, co drtis? 🎮';
        }
        setMessages([{ role: 'model', text: greeting, timestamp: Date.now() }]);
        setWelcomeLoaded(true);
      });
    }
    if (!isOpen) {
      setWelcomeLoaded(false);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 1) {
      getUserProfile().then(profile => {
        saveChatToHistory(messages, profile.nickname);
      });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      refreshMessageCount();
    }
  }, [messages, isOpen]);

  // Handle close with memory extraction
  const handleClose = useCallback(async () => {
    // Only extract memory if there were actual user messages
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length >= 1) {
      // Run memory extraction async — don't block the UI
      const profile = await getUserProfile();
      const conversationText = messages.map(m => `${m.role === 'user' ? 'Uživatel' : 'Skiller'}: ${m.text}`).join('\n');
      updateUserMemory(profile, conversationText).then(updated => {
        console.log('[Memory] Profile updated:', updated.nickname, updated.persona);
      });
    }
    // Reset messages for next open
    setMessages([]);
    onClose();
  }, [messages, onClose]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = { role: 'user', text: inputValue, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // User profile updates
    const currentProfile = await getUserProfile();
    const updatedProfile = detectUserIdentity(userMessage.text, currentProfile) || currentProfile;
    updatedProfile.interactionCount += 1;
    await saveUserProfile(updatedProfile);

    // Prepare history for API
    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    // Send to Gemini (Limit and logging is handled inside the service/utils)
    const responseText = await sendMessageToGemini(userMessage.text, history);

    const botMessage: ChatMessage = { role: 'model', text: responseText, timestamp: Date.now() };
    setMessages(prev => [...prev, botMessage]);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  const currentCount = getDailyMessageCount();
  const limitReached = isAiLimitReached();

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/95 sm:bg-black/80 backdrop-blur-sm" onClick={handleClose}>
      <div
        className="w-full h-full sm:h-auto sm:max-h-[600px] sm:max-w-lg bg-dark-bg sm:border border-sz-red shadow-[0_0_50px_rgba(227,30,36,0.3)] flex flex-col overflow-hidden sm:rounded-sm animate-in slide-in-from-bottom duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-zinc-900 p-4 flex justify-between items-center border-b border-sz-red/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sz-red/10 border border-sz-red flex items-center justify-center rounded-sm">
              <Bot className="w-6 h-6 text-sz-red" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg font-orbitron tracking-wide flex items-center gap-2">
                Skiller ;)
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">Companion v3.2</span>
                <span className={`text-[9px] font-bold px-1 rounded uppercase ${limitReached ? 'bg-red-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                  Load: {currentCount}%
                </span>
              </div>
            </div>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-white p-2 rounded">
            <X className="w-8 h-8 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-black/90 custom-scrollbar font-mono text-sm bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 border relative ${msg.role === 'user' ? 'bg-zinc-800 border-white/10 text-white rounded-tl-lg rounded-bl-lg rounded-br-lg' : 'bg-sz-red/5 border-sz-red/30 text-gray-200 rounded-tr-lg rounded-bl-lg rounded-br-lg'
                }`}>
                {msg.role === 'model' && (
                  <div className="absolute -top-2 -left-2 bg-black border border-sz-red/50 p-0.5 rounded-full">
                    <Terminal className="w-2 h-2 text-sz-red" />
                  </div>
                )}
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-900 border border-zinc-700 rounded-sm p-3">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-sz-red rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-sz-red rounded-full animate-bounce delay-75"></span>
                  <span className="w-1.5 h-1.5 bg-sz-red rounded-full animate-bounce delay-150"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-zinc-900 border-t border-white/10 shrink-0 pb-safe">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={limitReached}
              placeholder={limitReached ? "Dneska už mám padla..." : "Napiš Skillerovi..."}
              className="flex-1 bg-black border border-zinc-700 px-4 py-3 text-white focus:outline-none focus:border-sz-red font-mono placeholder-gray-600 rounded-sm disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading || limitReached}
              className="bg-sz-red hover:bg-white hover:text-black text-white px-6 rounded-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold uppercase"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <div className="text-[10px] text-gray-600 mt-2 text-center font-mono flex items-center justify-center gap-1">
            <Activity className="w-3 h-3" />
            Všechny konverzace jsou logovány na Neural Cloud server.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;
