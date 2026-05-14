import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: any[];
}

interface ChatViewProps {
  filename: string;
  activeCollection?: string | null;
}

export const ChatView: React.FC<ChatViewProps> = ({ filename, activeCollection }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi! I've processed **${filename}**. What would you like to know about it?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8001/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: input,
          collection: activeCollection 
        }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let assistantSources: any[] = [];
      
      const assistantId = (Date.now() + 1).toString();
      
      // Add initial empty assistant message
      setMessages((prev) => [...prev, {
        id: assistantId,
        role: 'assistant',
        content: '',
      }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        
        // Handle metadata chunk if present
        if (chunk.startsWith('__SOURCES__:')) {
          const parts = chunk.split('\n');
          const sourceData = parts[0].replace('__SOURCES__:', '');
          assistantSources = JSON.parse(sourceData);
          
          // Remaining text in the same chunk
          const remainingText = parts.slice(1).join('\n');
          assistantContent += remainingText;
        } else {
          assistantContent += chunk;
        }

        // Update assistant message content in real-time
        setMessages((prev) => prev.map(msg => 
          msg.id === assistantId 
            ? { ...msg, content: assistantContent, sources: assistantSources } 
            : msg
        ));
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [...prev, {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800">
      <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "flex w-full",
                message.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn(
                "flex max-w-[85%] space-x-3",
                message.role === 'user' ? "flex-row-reverse space-x-reverse" : "flex-row"
              )}>
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                  message.role === 'user' ? "bg-primary text-white" : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                )}>
                  {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className="flex flex-col space-y-2 overflow-hidden">
                  <div className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm",
                    message.role === 'user' 
                      ? "bg-primary text-white" 
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  )}>
                    <div className="prose dark:prose-invert prose-sm max-w-none break-words">
                      <ReactMarkdown>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                  
                  {/* Sources display */}
                  {message.sources && message.sources.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-wrap gap-2 pt-1"
                    >
                      {message.sources.map((source, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center space-x-1 px-2 py-1 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-md text-[10px] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-help"
                          title={`Source: ${source.metadata?.source || 'Unknown'}\nSection: ${source.metadata?.section || 'N/A'}\nUploaded: ${source.metadata?.timestamp || 'N/A'}\n\nContent: ${source.content}`}
                        >
                          <BookOpen size={10} />
                          <span>Page {source.metadata?.page + 1 || idx + 1}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex space-x-3">
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                <Bot size={18} className="text-gray-600 dark:text-gray-400" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2 flex items-center">
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <form onSubmit={handleSendMessage} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-xl py-3 pl-4 pr-12 focus:ring-2 focus:ring-primary text-sm outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-dark transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
