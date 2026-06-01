import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { GREEN, GREEN_LIGHT, BORDER_COLOR, TEXT_DARK, TEXT_LIGHT } from '../constants';
import client from '../api/client';

export default function AI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef();

  const fetchHistory = async () => {
    try {
      const res = await client.get('/ai/chat/');
      if (res.data && res.data.length > 0) {
        setMessages(res.data);
      } else {
        // Welcome message if no chat logs exist yet
        setMessages([
          {
            id: 'welcome',
            role: 'ai',
            text: '🤖 Namaste! I am AquaSetu AI, your expert fish farming helper. Ask me about feed, water quality, disease management, or current market rates in India.',
          },
        ]);
      }
    } catch (e) {
      console.log('Error fetching chat history', e);
      setMessages([
        {
          id: 'welcome',
          role: 'ai',
          text: '🤖 Namaste! I am AquaSetu AI, your expert fish farming helper. Ask me about feed, water quality, disease management, or current market rates in India.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSend = async (textToSend) => {
    const msgText = textToSend || input;
    if (!msgText.trim()) return;

    // Add user message
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      text: msgText.trim(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    // Scroll to bottom
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res = await client.post('/ai/chat/', {
        message: msgText.trim(),
      });
      
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: res.data.reply,
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      console.log('Error calling AI chat endpoint', e);
      const errMsg = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: '⚠️ Sorry, I could not reach my brain right now. Please check if the Django backend server is running and try again!',
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleClearHistory = async () => {
    Alert.alert('Clear Chat Memory', 'Are you sure you want to delete all messages? This will reset the chatbot\'s memory.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete All',
        style: 'destructive',
        onPress: async () => {
          try {
            await client.delete('/ai/clear/');
            setMessages([
              {
                id: 'welcome',
                role: 'ai',
                text: '🤖 Chat memory cleared. Ask me anything about your fish pond!',
              },
            ]);
          } catch (e) {
            console.log('Error clearing history', e);
            Alert.alert('Error', 'Failed to clear chat memory.');
          }
        },
      },
    ]);
  };

  const suggestions = [
    "🌱 Best feed rate for Rohu?",
    "📈 Fish rates in Nellore?",
    "🌤️ Cloudy day feeding guidelines?",
    "💧 Ideal pond pH levels?",
  ];

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color={GREEN} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      style={styles.container}
    >
      {/* Mini header for clearing history */}
      <View style={styles.subHeader}>
        <Text style={styles.headerStatus}>🟢 AI Online</Text>
        <TouchableOpacity style={styles.clearBtn} onPress={handleClearHistory}>
          <Text style={styles.clearBtnTxt}>🗑️ Clear Memory</Text>
        </TouchableOpacity>
      </View>

      {/* Suggestions block when only welcome message exists */}
      {messages.length <= 1 ? (
        <View style={styles.suggestBox}>
          <Text style={styles.suggestTitle}>Suggested Questions:</Text>
          <View style={styles.suggestGrid}>
            {suggestions.map((s, idx) => (
              <TouchableOpacity key={idx} style={styles.suggestBtn} onPress={() => handleSend(s)}>
                <Text style={styles.suggestTxt}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      <ScrollView
        ref={scrollRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatScroll}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <View
              key={m.id}
              style={[
                styles.bubbleWrapper,
                isUser ? styles.userWrapper : styles.aiWrapper,
              ]}
            >
              <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
                <Text style={[styles.bubbleText, isUser ? styles.userText : styles.aiText]}>
                  {m.text}
                </Text>
              </View>
            </View>
          );
        })}

        {typing && (
          <View style={[styles.bubbleWrapper, styles.aiWrapper]}>
            <View style={[styles.bubble, styles.aiBubble, styles.typingBubble]}>
              <ActivityIndicator size="small" color={GREEN} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Ask AquaSetu AI..."
          placeholderTextColor="#94a3b8"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => handleSend()}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={() => handleSend()}>
          <Text style={styles.sendIcon}>➔</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  headerStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    color: GREEN,
  },
  clearBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#fef2f2',
  },
  clearBtnTxt: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: 'bold',
  },
  suggestBox: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  suggestTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: TEXT_LIGHT,
    marginBottom: 8,
  },
  suggestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  suggestBtn: {
    backgroundColor: GREEN_LIGHT,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
    borderWidth: 1,
    borderColor: GREEN + '20',
  },
  suggestTxt: {
    fontSize: 12,
    color: GREEN,
    fontWeight: '600',
  },
  chatArea: {
    flex: 1,
  },
  chatScroll: {
    padding: 16,
    paddingBottom: 24,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    marginBottom: 12,
    width: '100%',
  },
  userWrapper: {
    justifyContent: 'flex-end',
  },
  aiWrapper: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  userBubble: {
    backgroundColor: GREEN,
    borderBottomRightRadius: 2,
  },
  aiBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  typingBubble: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#ffffff',
  },
  aiText: {
    color: TEXT_DARK,
  },
  inputBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 14,
    marginRight: 8,
    color: TEXT_DARK,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  sendIcon: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
