import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import {
  Container,
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  Avatar,
  List,
  ListItem,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Send,
  ArrowBack,
  Lock,
  Call,
  Videocam,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { chatAPI, usersAPI, getSocketUrl } from '../../services/api';
import { ChatEncryption } from '../../utils/chatEncryption';
import CallComponent from '../call/CallComponent';

interface Message {
  _id: string;
  sender: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar: string;
  };
  receiver: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar: string;
  };
  content: string;
  messageType: string;
  isRead: boolean;
  createdAt: string;
}

interface User {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string;
  isOnline: boolean;
  lastSeen: string;
}

const Chat: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatUser, setChatUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<any>(null);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const [isEncryptionEnabled, setIsEncryptionEnabled] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState<string>('');
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Initialize encryption for this chat
  const initializeEncryption = useCallback(() => {
    if (user?._id && userId) {
      const chatKey = ChatEncryption.generateChatKey(user._id, userId);
      setEncryptionKey(chatKey);
      
      // Test the encryption to make sure it works
      const testPassed = ChatEncryption.testEncryption(chatKey);
      console.log('🔐 Encryption initialized:', { 
        key: chatKey.substring(0, 20) + '...', 
        testPassed,
        enabled: isEncryptionEnabled 
      });
    }
  }, [user?._id, userId, isEncryptionEnabled]);


  const fetchChatData = useCallback(async () => {
    try {
      const [messagesRes, userRes] = await Promise.all([
        chatAPI.getChatHistory(userId!),
        usersAPI.getUserProfile(userId!),
      ]);
      
      // Sort messages by creation date (oldest first, newest at bottom)
      const sortedMessages = messagesRes.data.messages.sort((a: Message, b: Message) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      // Decrypt messages if encryption is enabled
      const processedMessages = sortedMessages.map((msg: Message) => {
        if (!isEncryptionEnabled || !encryptionKey) {
          return msg;
        }
        
        // Try to decrypt the message
        if (ChatEncryption.isEncrypted(msg.content)) {
          try {
            const decryptedContent = ChatEncryption.decrypt(msg.content, encryptionKey);
            console.log('🔐 Decrypted message:', { 
              original: msg.content.substring(0, 30) + '...', 
              decrypted: decryptedContent 
            });
            return { ...msg, content: decryptedContent };
          } catch (error) {
            console.error('❌ Error decrypting message:', error);
            return msg; // Keep encrypted if decryption fails
          }
        }
        
        return msg;
      });
      
      setMessages(processedMessages);
      setChatUser(userRes.data.user);
      
      // Mark all unread messages as read when chat is opened
      const unreadMessages = messagesRes.data.messages.filter((msg: Message) => 
        msg.receiver._id === user?._id && !msg.isRead
      );
      
      if (unreadMessages.length > 0) {
        // Update local state to reflect read status first
        const updatedMessages = messagesRes.data.messages.map((msg: Message) => 
          msg.receiver._id === user?._id && !msg.isRead 
            ? { ...msg, isRead: true, readAt: new Date().toISOString() }
            : msg
        );
        setMessages(updatedMessages);
        
        // Then emit Socket.io event if socket is available
        if (socket) {
          const messageIds = unreadMessages.map((msg: Message) => msg._id);
          socket.emit('mark_messages_read', {
            messageIds,
            senderId: userId
          });
        }
      }
    } catch (error) {
      console.error('Error fetching chat data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const initializeSocket = useCallback(() => {
    if (!user?._id) return;
    
    // Disconnect existing socket if any
    if (socket) {
      console.log('Disconnecting existing socket');
      socket.disconnect();
    }
    
    console.log('Initializing socket for user:', user._id);
    const newSocket = io(getSocketUrl());
    
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      console.log('Socket connected state:', newSocket.connected);
      // Join room after connection is established
      newSocket.emit('join_room', user._id);
    });
    
    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
    
    newSocket.on('connect_error', (error: any) => {
      console.error('Socket connection error:', error);
    });
    
    newSocket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });
    
    newSocket.on('receive_message', async (data: any) => {
      console.log('Received message:', data);
      console.log('Current userId:', userId);
      console.log('data.senderId:', data.senderId);
      
      // Show message if it's from the current chat user (userId) to the current user
      if (data.senderId === userId) {
        console.log('Processing message from current chat user');
        
        // Decrypt the message if encryption is enabled
        let messageContent = data.message;
        if (isEncryptionEnabled && encryptionKey && ChatEncryption.isEncrypted(data.message)) {
          try {
            messageContent = ChatEncryption.decrypt(data.message, encryptionKey);
            console.log('🔐 Decrypted incoming message:', { 
              original: data.message.substring(0, 30) + '...', 
              decrypted: messageContent 
            });
          } catch (error) {
            console.error('❌ Error decrypting incoming message:', error);
            messageContent = data.message; // Fallback to encrypted message
          }
        }

        const newMsg: Message = {
          _id: data.messageId || Date.now().toString(),
          sender: {
            _id: data.senderId,
            username: chatUser?.username || '',
            firstName: chatUser?.firstName || '',
            lastName: chatUser?.lastName || '',
            avatar: chatUser?.avatar || '',
          },
          receiver: {
            _id: user?._id || '',
            username: user?.username || '',
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            avatar: user?.avatar || '',
          },
          content: messageContent,
          messageType: 'text',
          isRead: false,
          createdAt: data.timestamp,
        };
        
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some(msg => msg._id === newMsg._id || 
            (msg.content === newMsg.content && msg.sender._id === newMsg.sender._id && 
             Math.abs(new Date(msg.createdAt).getTime() - new Date(newMsg.createdAt).getTime()) < 1000));
          
          if (exists) {
            console.log('Message already exists, skipping');
            return prev;
          }
          
          console.log('Adding new message to state');
          return [...prev, newMsg];
        });
        
        // Mark the message as read since user is currently viewing the chat
        if (data.messageId && newSocket) {
          try {
            // Use Socket.io for marking as read
            newSocket.emit('mark_messages_read', {
              messageIds: [data.messageId],
              senderId: data.senderId
            });
            
            // Update the message in local state to show as read
            setMessages(prev => prev.map(msg => 
              msg._id === data.messageId 
                ? { ...msg, isRead: true, readAt: new Date().toISOString() }
                : msg
            ));
          } catch (error) {
            console.error('Error marking message as read:', error);
          }
        }
      } else {
        console.log('Message not from current chat user, ignoring');
      }
    });

    // Call event handlers
    newSocket.on('call_user', (data: any) => {
      console.log('📞 Incoming call from:', data.from);
      setCallType(data.type);
      setIsIncomingCall(true);
      setIsCallOpen(true);
    });

    newSocket.on('call_accepted', (data: any) => {
      console.log('📞 Call accepted by:', data.from);
      // Update call state to show call is active
      setIsIncomingCall(false);
      // Keep call dialog open to show active call state
    });

    newSocket.on('call_rejected', (data: any) => {
      console.log('📞 Call rejected by:', data.from);
      setIsCallOpen(false);
    });

    newSocket.on('call_end', (data: any) => {
      console.log('📞 Call ended by:', data.from);
      setIsCallOpen(false);
    });

    // WebRTC signaling events
    newSocket.on('webrtc_signal', (data: any) => {
      console.log('📡 Received WebRTC signal:', data);
      // This will be handled by CallComponent
    });
    
    console.log('Setting socket in state:', newSocket);
    setSocket(newSocket);
  }, [user?._id]); // Only depend on user._id to prevent constant recreation

  useEffect(() => {
    if (userId && user) {
      initializeEncryption();
      fetchChatData();
      initializeSocket();
    }

    return () => {
      if (socket) {
        console.log('Disconnecting socket on cleanup');
        socket.disconnect();
        setSocket(null);
      }
    };
  }, [userId, user?._id, isEncryptionEnabled]);

  useEffect(() => {
    // Only scroll to bottom when new messages are added, not on every render
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  const handleSendMessage = async () => {
    console.log('handleSendMessage called');
    console.log('newMessage:', newMessage);
    console.log('userId:', userId);
    console.log('socket:', socket);
    console.log('socket connected:', socket?.connected);
    
    if (!newMessage.trim() || !userId || !socket) {
      console.log('Missing required data for sending message');
      return;
    }

    // Check if socket is connected
    if (!socket.connected) {
      console.log('Socket not connected, cannot send message');
      return;
    }

    try {
      let messageToSend = newMessage.trim();
      
      // Encrypt the message if encryption is enabled
      if (isEncryptionEnabled && encryptionKey) {
        try {
          messageToSend = ChatEncryption.encrypt(newMessage.trim(), encryptionKey);
          console.log('🔐 Message encrypted:', messageToSend.substring(0, 50) + '...');
        } catch (error) {
          console.error('❌ Error encrypting message:', error);
          messageToSend = newMessage.trim(); // Fallback to unencrypted
        }
      }
      
      const messageData = {
        receiverId: userId,
        message: messageToSend,
        senderId: user?._id,
      };

      console.log('Sending message:', messageData);
      console.log('Socket connected:', socket.connected);
      
      // Send via socket for real-time (this also saves to database)
      socket.emit('send_message', messageData);

      // Add message to local state immediately for better UX
      // For the sender, always show plain text (not encrypted)
      const newMsg: Message = {
        _id: Date.now().toString(), // Temporary ID
        sender: {
          _id: user?._id || '',
          username: user?.username || '',
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          avatar: user?.avatar || '',
        },
        receiver: {
          _id: userId,
          username: chatUser?.username || '',
          firstName: chatUser?.firstName || '',
          lastName: chatUser?.lastName || '',
          avatar: chatUser?.avatar || '',
        },
        content: newMessage.trim(), // Always show plain text for sender
        messageType: 'text',
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Call handling functions
  const handleStartCall = async (type: 'voice' | 'video') => {
    console.log('📞 Starting call:', { type, userId, socketConnected: socket?.connected, chatUserOnline: chatUser?.isOnline });
    
    // Check if WebRTC is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('WebRTC is not supported in this browser or context. Please use a modern browser and ensure you\'re accessing the app via HTTPS or localhost.');
      return;
    }
    
    // Prevent calling yourself
    if (user?._id === userId) {
      alert('You cannot call yourself! Please test with different users.');
      return;
    }
    
    try {
      setCallType(type);
      setIsIncomingCall(false);
      setIsCallOpen(true);
      
      // Emit call signal to remote user
      if (socket && userId) {
        console.log('📞 Emitting call_user event:', { to: userId, type: type, from: user?._id });
        socket.emit('call_user', {
          to: userId,
          type: type,
          from: user?._id
        });
      } else {
        console.error('❌ Cannot start call - missing socket or userId:', { socket: !!socket, userId });
      }
    } catch (error) {
      console.error('❌ Error starting call:', error);
      setIsCallOpen(false);
    }
  };

  const handleCallAnswer = () => {
    console.log('📞 Call answered by current user');
    
    // Only emit call_accepted if we're not already in an active call
    if (!isCallOpen || !isIncomingCall) {
      console.log('📞 Not in incoming call state, ignoring answer');
      return;
    }
    
    // Prevent duplicate events by checking if we're the same user
    if (user?._id === userId) {
      console.log('📞 Cannot call yourself, ignoring');
      return;
    }
    
    // Emit call accepted signal to the caller
    if (socket && userId) {
      console.log('📞 Emitting call_accepted event:', { to: userId, from: user?._id });
      socket.emit('call_accepted', {
        to: userId,
        from: user?._id
      });
    }
  };

  const handleCallReject = () => {
    console.log('📞 Call rejected by current user');
    setIsCallOpen(false);
    
    // Emit call rejected signal to the caller
    if (socket && userId) {
      console.log('📞 Emitting call_rejected event:', { to: userId, from: user?._id });
      socket.emit('call_rejected', {
        to: userId,
        from: user?._id
      });
    }
  };

  const handleCallEnd = () => {
    console.log('📞 Call ended by current user');
    setIsCallOpen(false);
    
    // Emit call end signal
    if (socket && userId) {
      console.log('📞 Emitting call_end event:', { to: userId, from: user?._id });
      socket.emit('call_end', {
        to: userId,
        from: user?._id
      });
    }
  };


  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading chat...</Typography>
      </Container>
    );
  }

  if (!chatUser) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          User not found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          The user you're trying to chat with doesn't exist or you don't have permission to chat with them.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/dashboard')}>
            <ArrowBack />
          </IconButton>
          <Avatar src={chatUser.avatar}>
            {chatUser.firstName[0]}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6">
              {chatUser.firstName} {chatUser.lastName}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: chatUser.isOnline ? 'green' : 'gray',
                }}
              />
              <Typography variant="body2" color="text.secondary">
                {chatUser.isOnline ? 'Online' : 'Offline'}
              </Typography>
              <Chip
                icon={<Lock />}
                label={isEncryptionEnabled ? "Encrypted" : "Unencrypted"}
                size="small"
                color={isEncryptionEnabled ? "success" : "default"}
                variant="outlined"
                onClick={() => setIsEncryptionEnabled(!isEncryptionEnabled)}
                sx={{ cursor: 'pointer' }}
              />
            </Box>
          </Box>
          
          {/* Call Buttons */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={() => {
                console.log('📞 Voice call button clicked');
                handleStartCall('voice');
              }}
              sx={{
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': { backgroundColor: 'primary.dark' },
              }}
              disabled={!chatUser?.isOnline}
            >
              <Call />
            </IconButton>
            <IconButton
              onClick={() => {
                console.log('📹 Video call button clicked');
                handleStartCall('video');
              }}
              sx={{
                backgroundColor: 'secondary.main',
                color: 'white',
                '&:hover': { backgroundColor: 'secondary.dark' },
              }}
              disabled={!chatUser?.isOnline}
            >
              <Videocam />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Messages */}
      <Paper 
        elevation={1} 
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto', 
          p: 2, 
          mb: 2,
          backgroundColor: '#fafafa',
        }}
      >
        {messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          <List>
            {messages.map((message, index) => {
              const isOwnMessage = message.sender._id === user?._id;
              return (
                <React.Fragment key={message._id}>
                  <ListItem sx={{ justifyContent: isOwnMessage ? 'flex-end' : 'flex-start' }}>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
                        maxWidth: '70%',
                      }}
                    >
                      {!isOwnMessage && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Avatar
                            src={message.sender.avatar}
                            sx={{ width: 24, height: 24, mr: 1 }}
                          >
                            {message.sender.firstName[0]}
                          </Avatar>
                          <Typography variant="caption" color="text.secondary">
                            {message.sender.firstName}
                          </Typography>
                        </Box>
                      )}
                      <Paper
                        elevation={1}
                        sx={{
                          p: 1.5,
                          backgroundColor: isOwnMessage ? 'primary.main' : 'white',
                          color: isOwnMessage ? 'white' : 'text.primary',
                        }}
                      >
                        <Typography variant="body1">
                          {message.content}
                        </Typography>
                      </Paper>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                        {formatTime(message.createdAt)}
                      </Typography>
                    </Box>
                  </ListItem>
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </List>
        )}
      </Paper>

      {/* Message Input */}
      <Paper elevation={2} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            variant="outlined"
            size="small"
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <Send />
          </IconButton>
        </Box>
      </Paper>

      {/* Call Component */}
      {chatUser && (
        <CallComponent
          isOpen={isCallOpen}
          onClose={() => setIsCallOpen(false)}
          callType={callType}
          isIncoming={isIncomingCall}
          remoteUser={{
            _id: chatUser._id,
            firstName: chatUser.firstName,
            lastName: chatUser.lastName,
            avatar: chatUser.avatar
          }}
          onCallStart={handleCallAnswer}
          onCallAnswer={handleCallAnswer}
          onCallEnd={handleCallEnd}
          onCallReject={handleCallReject}
        />
      )}
    </Container>
  );
};

export default Chat;