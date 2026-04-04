import { useState, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { PromptTemplates } from '@/components/PromptTemplates';
import { Send, Bot, User, Trash2, Plus, Sparkles, Mic, Search, Settings, LayoutDashboard, MessageSquare, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Streamdown } from 'streamdown';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TypewriterEffect } from '@/components/TypewriterEffect';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

export default function AIAssistant() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'general' | 'document'>('general');
  const [message, setMessage] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState<number | undefined>();
  const [selectedModel, setSelectedModel] = useState('llama3.2');
  const [showTemplates, setShowTemplates] = useState(false);
  const [voiceConfirm, setVoiceConfirm] = useState<{ text: string; countdown: number; editing: boolean } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const voiceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: conversations = [], refetch: refetchConversations } = trpc.ai.getConversations.useQuery();
  const { data: messages = [], refetch: refetchMessages } = trpc.ai.getMessages.useQuery(
    { conversationId: currentConversationId! },
    { enabled: !!currentConversationId }
  );
  const { data: models = [] } = trpc.ai.listModels.useQuery();
  const { data: summaryData, isLoading: isLoadingSummary } = trpc.ai.getConversationSummary.useQuery(
    { conversationId: currentConversationId! },
    { enabled: !!currentConversationId }
  );

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (data) => {
      setCurrentConversationId(data.conversationId);
      refetchMessages();
      refetchConversations();
      setMessage('');
    },
  });

  const ragChatMutation = trpc.ai.ragChat.useMutation({
    onSuccess: (data) => {
      setCurrentConversationId(data.conversationId);
      refetchMessages();
      refetchConversations();
      setMessage('');
    },
  });

  const isPending = chatMutation.isPending || ragChatMutation.isPending;

  const createConversationMutation = trpc.ai.createConversation.useMutation({
    onSuccess: (data) => {
      setCurrentConversationId(data.conversationId);
      refetchConversations();
    },
  });

  const deleteConversationMutation = trpc.ai.deleteConversation.useMutation({
    onSuccess: () => {
      setCurrentConversationId(undefined);
      refetchConversations();
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPending]);

  useEffect(() => {
    const voiceCommand = sessionStorage.getItem('voice_command');
    if (!voiceCommand) return;
    sessionStorage.removeItem('voice_command');
    setMessage(voiceCommand);
    setVoiceConfirm({ text: voiceCommand, countdown: 2, editing: false });
  }, []);

  useEffect(() => {
    if (!voiceConfirm || voiceConfirm.editing) return;
    if (voiceConfirm.countdown <= 0) {
      handleVoiceSendNow();
      return;
    }
    voiceTimerRef.current = setInterval(() => {
      setVoiceConfirm((prev) =>
        prev && !prev.editing ? { ...prev, countdown: prev.countdown - 1 } : prev
      );
    }, 1000);
    return () => { if (voiceTimerRef.current) clearInterval(voiceTimerRef.current); };
  }, [voiceConfirm?.countdown, voiceConfirm?.editing]);

  const handleVoiceSendNow = () => {
    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    const text = voiceConfirm?.text || message.trim();
    if (!text) { setVoiceConfirm(null); return; }
    
    if (activeTab === 'general') {
      chatMutation.mutate({
        conversationId: currentConversationId,
        message: text,
        model: selectedModel,
        useTools: true,
      });
    } else {
      ragChatMutation.mutate({
        conversationId: currentConversationId,
        message: text,
      });
    }
    setVoiceConfirm(null);
    setMessage('');
  };

  const handleVoiceEdit = () => {
    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    setVoiceConfirm((prev) => prev ? { ...prev, editing: true } : null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleVoiceCancel = () => {
    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    setVoiceConfirm(null);
    setMessage('');
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    if (activeTab === 'general') {
      chatMutation.mutate({
        conversationId: currentConversationId,
        message: message.trim(),
        model: selectedModel,
        useTools: true,
      });
    } else {
      ragChatMutation.mutate({
        conversationId: currentConversationId,
        message: message.trim(),
      });
    }
  };

  const handleVoiceTranscription = (text: string, audioUrl?: string, summary?: string) => {
    setMessage(text);
    if (summary) {
      toast.success("Voice summarized", {
        description: summary,
      });
    }
  };

  const handleNewConversation = () => {
    createConversationMutation.mutate({
      title: 'New Conversation',
      modelName: selectedModel,
    });
  };

  const handleDeleteConversation = (id: number) => {
    if (confirm(t('aiAssistant.confirmDelete') || 'Delete this conversation?')) {
      deleteConversationMutation.mutate({ conversationId: id });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectTemplate = (prompt: string) => {
    setMessage(prompt);
    setShowTemplates(false);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background/50 backdrop-blur-[2px] overflow-hidden -mx-4 -mt-4">
      {/* Sidebar - Conversation History */}
      <motion.div 
        initial={{ x: -20, opacity: 0 }} 
        animate={{ x: 0, opacity: 1 }} 
        className="w-72 flex flex-col gap-2 border-r border-border/50 bg-card/30 backdrop-blur-xl shrink-0 z-10 p-4"
      >
        <div className="flex items-center justify-between mb-4 mt-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('aiAssistant.conversations') || 'Conversations'}</h2>
          <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-orange-500/10 hover:text-orange-500 rounded-full transition-colors" onClick={handleNewConversation}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          <AnimatePresence initial={false}>
            {conversations.map((conv) => (
              <motion.div 
                key={conv.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={cn(
                    "p-3 cursor-pointer transition-all duration-300 border-transparent hover:border-orange-500/30 group",
                    currentConversationId === conv.id 
                      ? 'bg-orange-500/10 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.1)]' 
                      : 'bg-transparent hover:bg-muted/40'
                  )}
                  onClick={() => setCurrentConversationId(conv.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium truncate transition-colors",
                        currentConversationId === conv.id ? "text-orange-500" : "text-foreground"
                      )}>
                        {conv.title || 'New Conversation'}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {new Date(conv.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conv.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* Header - Glassmorphic top bar */}
        <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-background/90 via-background/60 to-transparent backdrop-blur-md z-20 pointer-events-none" />
        
        <div className="flex items-center justify-between p-6 px-8 z-30 shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-xl border border-orange-500/20 shadow-inner">
                  <Bot className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">{t('aiAssistant.title') || 'Azvirt AI'}</h1>
                  <p className="text-xs text-muted-foreground">Smart Assistant</p>
                </div>
              </div>
              <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-[300px]">
                <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 border border-border/50">
                  <TabsTrigger value="general" className="flex items-center gap-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-orange-500">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Chat</span>
                  </TabsTrigger>
                  <TabsTrigger value="document" className="flex items-center gap-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-orange-500">
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Docs</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Model Selector */}
            <AnimatePresence mode="wait">
              {activeTab === 'general' ? (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-3 bg-muted/30 px-3 py-1.5 rounded-full border border-border/50 backdrop-blur-sm"
                >
                  <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="w-32 h-7 text-xs border-none bg-transparent shadow-none focus:ring-0 px-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.length > 0 ? (
                        models.map((model) => (
                          <SelectItem key={model.name} value={model.name} className="text-xs">
                            {model.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="llama3.2" className="text-xs">llama3.2</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-medium backdrop-blur-sm"
                >
                  <Search className="h-3.5 w-3.5" />
                  RAG Mode Active
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-8 relative z-10 pb-8 custom-scrollbar">
          
          {/* Voice confirm notification */}
          <AnimatePresence>
            {voiceConfirm && (
              <motion.div 
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="flex items-start gap-3 rounded-xl border border-orange-500/30 bg-orange-500/10 backdrop-blur-md px-5 py-4 mb-6 shadow-lg shadow-orange-500/5"
              >
                <div className="bg-orange-500/20 p-2 rounded-full mt-0.5">
                  <Mic className="h-4 w-4 text-orange-500 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-orange-600 dark:text-orange-400 font-medium mb-1">
                    {voiceConfirm.editing
                      ? 'Confirm or edit your command:'
                      : <span>Sending automatically in <strong className="tabular-nums font-bold">{voiceConfirm.countdown}s</strong></span>}
                  </p>
                  <p className="text-sm text-foreground/80 italic font-medium">
                    &ldquo;{voiceConfirm.text}&rdquo;
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!voiceConfirm.editing ? (
                    <>
                      <Button onClick={handleVoiceSendNow} size="sm" className="bg-orange-500 hover:bg-orange-600 text-white h-8">
                        <Sparkles className="h-3.5 w-3.5 mr-1" />
                        Send Now
                      </Button>
                      <Button onClick={handleVoiceEdit} size="sm" variant="outline" className="h-8 border-orange-500/30 hover:bg-orange-500/10 text-orange-500">
                        <Settings className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                    </>
                  ) : (
                    <Button onClick={handleVoiceSendNow} size="sm" className="bg-orange-500 hover:bg-orange-600 text-white h-8">
                      <Sparkles className="h-3.5 w-3.5 mr-1" />
                      Send
                    </Button>
                  )}
                  <Button onClick={handleVoiceCancel} size="icon" variant="ghost" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Conversation Summary Section */}
          <AnimatePresence>
            {currentConversationId && messages.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <div className="bg-gradient-to-r from-orange-500/10 to-transparent border-l-2 border-orange-500 rounded-r-xl p-4 relative overflow-hidden group">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-orange-500" />
                    <h3 className="text-xs font-bold text-orange-500 uppercase tracking-widest">
                      {t('aiAssistant.sessionSummary') || 'Session Context'}
                    </h3>
                  </div>

                  {isLoadingSummary ? (
                    <div className="flex items-center gap-2 py-1 relative z-10">
                      <Sparkles className="h-3 w-3 animate-spin text-orange-500" />
                      <p className="text-xs text-muted-foreground animate-pulse">Generating context...</p>
                    </div>
                  ) : summaryData?.summary ? (
                    <p className="text-sm leading-relaxed text-foreground/80 relative z-10 selection:bg-orange-500/30">
                      {summaryData.summary}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No summary available yet.</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!currentConversationId && messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center justify-center h-full text-center p-8 max-w-2xl mx-auto"
            >
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full" />
                <div className="bg-card border border-orange-500/20 p-6 rounded-3xl shadow-2xl relative">
                  <Bot className="h-20 w-20 text-orange-500" />
                </div>
              </div>
              <h2 className="text-3xl font-bold tracking-tight mb-3">
                {t('aiAssistant.welcome') || 'How can I help you today?'}
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                {t('aiAssistant.description') ||
                  "I'm your intelligent copilot for concrete production. Ask me about quality tests, materials, or forecasts."}
              </p>
              
              <div className="grid grid-cols-2 gap-4 w-full">
                {["Predict concrete strength for Mix A", "Summarize latest lab tests", "Analyze material usage this week", "Show me the delivery schedule"].map((suggestion, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                  >
                    <Card 
                      className="p-4 bg-muted/30 hover:bg-orange-500/5 hover:border-orange-500/30 cursor-pointer transition-all border-border/50 text-left h-full"
                      onClick={() => setMessage(suggestion)}
                    >
                      <p className="text-sm font-medium text-foreground/80">{suggestion}</p>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Chat Bubbles */}
          <div className="space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((message, index) => {
                      const isLastAssistantMessage = 
                        message.role === 'assistant' && 
                        index === messages.length - 1;

                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          className={cn(
                            "flex items-start gap-3 max-w-[85%]",
                            message.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                          )}
                        >
                          <div className={cn(
                            "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center shadow-md",
                            message.role === 'user' 
                              ? "bg-gradient-to-br from-orange-500 to-amber-600 text-white" 
                              : "bg-muted text-muted-foreground"
                          )}>
                            {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                          </div>
                          
                          <div className={cn(
                            "group relative px-4 py-2.5 rounded-2xl shadow-sm transition-shadow hover:shadow-md",
                            message.role === 'user' 
                              ? "bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-tr-none" 
                              : "bg-card border border-border/50 text-card-foreground rounded-tl-none backdrop-blur-sm"
                          )}>
                            <div className="text-sm leading-relaxed whitespace-pre-wrap">
                              {isLastAssistantMessage ? (
                                <TypewriterEffect 
                                  text={message.content} 
                                  speed={message.content.length > 200 ? 5 : 15} 
                                />
                              ) : (
                                message.content
                              )}
                            </div>
                            
                            <div className={cn(
                              "text-[10px] mt-1 opacity-0 group-hover:opacity-60 transition-opacity",
                              message.role === 'user' ? "text-right" : "text-left"
                            )}>
                              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
            </AnimatePresence>

            {/* Pending State */}
            {isPending && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 justify-start"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="bg-card/80 backdrop-blur-md border border-border/50 rounded-3xl rounded-tl-sm px-6 py-4 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-2 h-2 rounded-full bg-orange-500/40" />
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 rounded-full bg-orange-500/60" />
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 rounded-full bg-orange-500/80" />
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Scroll Anchor */}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* Input Area - Floating Bottom Bar */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background via-background/90 to-transparent pt-12 pb-6 px-8 z-20 pointer-events-none">
          <div className="max-w-4xl mx-auto pointer-events-auto">
            <div className="relative group transition-all duration-300">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
              <div className="relative flex items-center bg-card border border-border/50 rounded-2xl px-4 py-2 shadow-2xl backdrop-blur-xl">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10 rounded-xl transition-all"
                  onClick={() => setShowTemplates(true)}
                >
                  <Plus className="h-5 w-5" />
                </Button>
                
                <Input
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={activeTab === 'general' ? "Type a message..." : "Ask questions about your documents..."}
                  className="flex-1 bg-transparent border-none focus-visible:ring-0 text-base py-6 px-4 placeholder:text-muted-foreground/50"
                />

                <div className="flex items-center gap-2">
                  <VoiceRecorder 
                    onTranscription={handleVoiceTranscription} 
                  />
                  
                  <Button 
                    onClick={handleSendMessage}
                    disabled={isPending || !message.trim()}
                    className={cn(
                      "h-10 w-10 p-0 rounded-xl shadow-lg transition-all duration-300",
                      message.trim() 
                        ? "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20 translate-x-0 opacity-100" 
                        : "bg-muted text-muted-foreground scale-95"
                    )}
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 ml-0.5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-3">
              <span className="text-[10px] text-muted-foreground/50 font-medium tracking-wide">AI can make mistakes. Check important info.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
