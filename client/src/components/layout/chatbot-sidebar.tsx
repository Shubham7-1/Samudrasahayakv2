import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useSpeechSynthesis, useSpeechRecognition } from '@/hooks/use-speech';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  id: string;
  message: string;
  response: string;
  timestamp: Date;
  isUser?: boolean;
}

interface ChatbotSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentWeather?: any;
  currentLocation?: string;
  language: string;
}

export function ChatbotSidebar({ 
  isOpen, 
  onClose, 
  userId, 
  currentWeather, 
  currentLocation,
  language 
}: ChatbotSidebarProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  const { speak, speaking } = useSpeechSynthesis();
  const { isListening, transcript, startListening, stopListening } = useSpeechRecognition();

  // Load chat history
  const { data: chatHistory } = useQuery({
    queryKey: ['/api/chat', userId],
    enabled: !!userId && isOpen,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (newMessage: string) => {
      const response = await apiRequest('POST', '/api/chat', {
        message: newMessage,
        userId,
        context: {
          weather: currentWeather,
          location: currentLocation
        }
      });
      return response.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        id: data.id,
        message: data.message,
        response: data.response,
        timestamp: new Date(data.timestamp),
        isUser: false
      }]);
      
      // Speak the response if voice is enabled
      if (speaking) {
        speak(data.response, { lang: language });
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/chat', userId] });
    },
  });

  useEffect(() => {
    if (chatHistory && Array.isArray(chatHistory)) {
      // Convert timestamps to Date objects
      const messagesWithDates = chatHistory.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      setMessages(messagesWithDates);
    }
  }, [chatHistory]);

  useEffect(() => {
    // Add a small delay to ensure the DOM is ready after HMR
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    };
    
    // Use setTimeout to ensure DOM is fully rendered after state updates
    const timeoutId = setTimeout(scrollToBottom, 50);
    
    return () => clearTimeout(timeoutId);
  }, [messages]);

  useEffect(() => {
    if (transcript) {
      setMessage(transcript);
    }
  }, [transcript]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    // Add user message to UI immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      message: message,
      response: '',
      timestamp: new Date(),
      isUser: true
    };
    
    setMessages(prev => [...prev, userMessage]);
    sendMessageMutation.mutate(message);
    setMessage('');
  };

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening({ 
        lang: language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN', 
        continuous: false 
      });
    }
  };

  const quickQuestions = [
    "What's the best fishing time today?",
    "Weather in Mumbai",
    "Weather in Chennai", 
    "Safety tips for today",
    "Best fishing spots nearby",
    "Optimize route to nearest fishing zone"
  ];

  return (
    <aside 
      className={`fixed right-0 top-0 h-full w-80 bg-card text-card-foreground shadow-2xl transition-transform duration-300 z-50 border-l border-border ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      data-testid="sidebar-chatbot"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
              <i className="fas fa-robot text-sm" />
            </div>
            <div>
              <h3 className="font-semibold">Fishing Assistant</h3>
              <p className="text-xs opacity-90">AI-powered guide</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30"
            data-testid="button-close-chat"
          >
            <i className="fas fa-times text-sm" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4 ios-scroll">
          <div className="space-y-4">
            {/* Welcome message */}
            {messages.length === 0 && (
              <div className="bg-muted text-muted-foreground rounded-lg p-3 max-w-xs">
                <p className="text-sm">Hello! I'm your fishing assistant. How can I help you today?</p>
                <span className="text-xs opacity-75">Now</span>
              </div>
            )}
            
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.isUser ? (
                  <div className="bg-primary text-primary-foreground rounded-lg p-3 max-w-xs ml-auto">
                    <p className="text-sm">{msg.message}</p>
                    <span className="text-xs opacity-75">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="bg-primary text-primary-foreground rounded-lg p-3 max-w-xs ml-auto">
                      <p className="text-sm">{msg.message}</p>
                      <span className="text-xs opacity-75">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="bg-muted text-muted-foreground rounded-lg p-3 max-w-xs">
                      <div className="text-sm prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown 
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                            ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                            li: ({ children }) => <li className="mb-1">{children}</li>
                          }}
                        >
                          {msg.response}
                        </ReactMarkdown>
                      </div>
                      <span className="text-xs opacity-75 block mt-2">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </>
                )}
              </div>
            ))}
            
            {sendMessageMutation.isPending && (
              <div className="bg-muted text-muted-foreground rounded-lg p-3 max-w-xs">
                <p className="text-sm">Thinking...</p>
                <div className="flex space-x-1 mt-2">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-200" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Quick Questions */}
        <div className="p-4 border-t border-border">
          <div className="text-sm font-medium mb-2">Quick Questions:</div>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question, index) => (
              <Button
                key={index}
                variant="secondary"
                size="sm"
                className="text-xs px-3 py-1 h-auto"
                onClick={() => {
                  setMessage(question);
                  setTimeout(handleSendMessage, 100);
                }}
                data-testid={`button-quick-${index}`}
              >
                {question}
              </Button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex space-x-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              data-testid="input-chat-message"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="w-10 h-10"
              data-testid="button-send-message"
            >
              <i className="fas fa-paper-plane text-sm" />
            </Button>
            <Button
              onClick={handleVoiceInput}
              className={`w-10 h-10 bg-accent text-accent-foreground hover:bg-accent/80 ${
                isListening ? 'animate-pulse' : ''
              }`}
              data-testid="button-voice-input"
            >
              <i className="fas fa-microphone text-sm" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
