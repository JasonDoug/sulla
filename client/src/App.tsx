import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Send, Settings, Terminal, FolderOpen, Key, Bot, User, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant' | 'tool';
  content: string;
}

function App() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    apiKey: '',
    model: 'google/gemini-2.0-flash-exp:free', // Default suggestion
    directory: '/home/jason', // Default suggestion
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('http://localhost:3001/config', config);
      setIsConfigured(true);
    } catch (err) {
      alert('Failed to connect: ' + err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Send the entire conversation history (filtering out tool calls if needed, 
      // but usually backend needs them if we were maintaining state there. 
      // Actually, our backend is stateless regarding history in the 'chat' endpoint 
      // except it rebuilds it. Wait, the backend logic I wrote:
      // "processMessage(messages)" takes the array.
      // So we should send `[...messages, userMsg]`.
      
      const response = await axios.post('http://localhost:3001/chat', {
        messages: [...messages, userMsg].map(m => ({
          role: m.role,
          content: m.content
        }))
      });

      const assistantMsg = response.data;
      setMessages(prev => [...prev, {
        role: assistantMsg.role,
        content: assistantMsg.content || ""
      }]);

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: Could not get response.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
          <div className="flex items-center gap-3 mb-6 text-blue-400">
            <Terminal size={32} />
            <h1 className="text-2xl font-bold">Sulla / MCP Client</h1>
          </div>
          
          <form onSubmit={handleConfigSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                <Key size={16} /> OpenRouter API Key
              </label>
              <input
                type="password"
                required
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                value={config.apiKey}
                onChange={e => setConfig({ ...config, apiKey: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                <Bot size={16} /> Model Name
              </label>
              <input
                type="text"
                required
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                value={config.model}
                onChange={e => setConfig({ ...config, model: e.target.value })}
                placeholder="e.g., google/gemini-2.0-flash-exp:free"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                <FolderOpen size={16} /> Target Directory
              </label>
              <input
                type="text"
                required
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                value={config.directory}
                onChange={e => setConfig({ ...config, directory: e.target.value })}
              />
              <p className="text-xs text-gray-400 mt-1">Local path to mount for the Filesystem MCP</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Connect & Start'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      <header className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2 font-bold text-lg text-blue-400">
          <Terminal /> Sulla Reference Client
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span className="flex items-center gap-1"><Bot size={14} /> {config.model}</span>
          <span className="flex items-center gap-1"><FolderOpen size={14} /> {config.directory}</span>
          <button onClick={() => setIsConfigured(false)} className="text-gray-500 hover:text-white transition-colors">
            <Settings size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50">
            <Bot size={64} className="mb-4" />
            <p>Ready to help with your filesystem.</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-4 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 border border-gray-700 text-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-1 opacity-70 text-xs uppercase font-bold tracking-wider">
                {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                {msg.role}
              </div>
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {loading && (
           <div className="flex justify-start">
             <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-sm flex items-center gap-2 text-gray-400">
                <Loader2 size={16} className="animate-spin" /> Thinking...
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <div className="bg-gray-800 p-4 border-t border-gray-700">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex gap-2">
          <input
            type="text"
            className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 text-gray-100 placeholder-gray-500"
            placeholder="Ask about your files (e.g., 'List files in current directory')..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button 
            type="submit" 
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-colors"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;