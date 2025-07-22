'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  Download, 
  Users, 
  Clock,
  AlertCircle,
  CheckCircle,
  Building
} from 'lucide-react';

type Agency = {
  id: string;
  name: string;
  logo_url?: string;
  primary_color?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  privacyMode: 'blind' | 'open';
};

type Message = {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'coach' | 'agency';
  content: string;
  timestamp: string;
  type: 'text' | 'document' | 'system';
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
};

type Conversation = {
  agencyId: string;
  messages: Message[];
  privacySettings: {
    allowChat: boolean;
    blindMode: boolean;
  };
};

export default function CoachCommunications() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Record<string, Conversation>>({});
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadAgencies();
  }, []);

  const loadAgencies = async () => {
    try {
      const response = await fetch('/api/coach/communications');
      if (response.ok) {
        const data = await response.json();
        setAgencies(data.agencies);
        setConversations(data.conversations);
        if (data.agencies.length > 0 && !selectedAgency) {
          setSelectedAgency(data.agencies[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading communications:', error);
      toast.error('Failed to load communications');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedAgency || sending) return;

    setSending(true);
    try {
      const response = await fetch('/api/coach/communications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agencyId: selectedAgency,
          content: newMessage,
          type: 'text',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update local state
        setConversations(prev => ({
          ...prev,
          [selectedAgency]: {
            ...prev[selectedAgency],
            messages: [...(prev[selectedAgency]?.messages || []), data.message],
          },
        }));
        
        setNewMessage('');
        toast.success('Message sent');
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const selectedConversation = selectedAgency ? conversations[selectedAgency] : null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Coach Communications</h1>
        <p className="text-muted-foreground">
          Chat with your agencies and share guidance documents
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Agency List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Your Agencies</CardTitle>
            <CardDescription>Select an agency to start chatting</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {agencies.length === 0 ? (
                <div className="p-4 text-center">
                  <Building className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No agencies yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {agencies.map((agency) => (
                    <div
                      key={agency.id}
                      className={`p-3 cursor-pointer hover:bg-muted/50 border-b ${
                        selectedAgency === agency.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedAgency(agency.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                          style={{ backgroundColor: agency.primary_color || '#3B82F6' }}
                        >
                          {agency.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">{agency.name}</p>
                            {agency.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {agency.unreadCount}
                              </Badge>
                            )}
                            <Badge 
                              variant={agency.privacyMode === 'blind' ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              {agency.privacyMode === 'blind' ? 'Blind' : 'Open'}
                            </Badge>
                          </div>
                          {agency.lastMessage && (
                            <p className="text-xs text-muted-foreground truncate">
                              {agency.lastMessage}
                            </p>
                          )}
                          {agency.lastMessageTime && (
                            <p className="text-xs text-muted-foreground">
                              {agency.lastMessageTime}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="lg:col-span-3">
          {selectedAgency && selectedConversation ? (
            <>
              <CardHeader className="flex flex-row items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                  style={{ backgroundColor: agencies.find(a => a.id === selectedAgency)?.primary_color || '#3B82F6' }}
                >
                  {agencies.find(a => a.id === selectedAgency)?.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {agencies.find(a => a.id === selectedAgency)?.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    {selectedConversation.privacySettings.blindMode ? (
                      <>
                        <AlertCircle className="h-3 w-3" />
                        Blind mode active - limited data visibility
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        Full communication enabled
                      </>
                    )}
                  </CardDescription>
                </div>
              </CardHeader>

              {selectedConversation.privacySettings.allowChat ? (
                <>
                  <CardContent>
                    <ScrollArea className="h-[350px]">
                      <div className="space-y-4">
                        {selectedConversation.messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex gap-3 ${
                              message.senderRole === 'coach' ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            {message.senderRole === 'agency' && (
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="text-xs">
                                  {message.senderName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                message.senderRole === 'coach'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="mt-2 space-y-2">
                                  {message.attachments.map((attachment, index) => (
                                    <div 
                                      key={index}
                                      className="flex items-center gap-2 p-2 bg-background/10 rounded"
                                    >
                                      <Paperclip className="h-3 w-3" />
                                      <span className="text-xs">{attachment.name}</span>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        <Download className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                            </div>

                            {message.senderRole === 'coach' && (
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                  C
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-3"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sending}
                        size="sm"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <CardContent className="flex items-center justify-center h-[400px]">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Chat Disabled</h3>
                    <p className="text-muted-foreground">
                      This agency has disabled coach communication in their privacy settings.
                    </p>
                  </div>
                </CardContent>
              )}
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-[500px]">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Select an Agency</h3>
                <p className="text-muted-foreground">
                  Choose an agency from the list to start a conversation
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}