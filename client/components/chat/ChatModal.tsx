import React, { useState } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput } from "react-native";
import { useGameStore } from "../../store/gameStore";
import { socketService } from "../../services/socketService";

const QUICK_EMOJIS = ["🎩", "💸", "🎲", "😢", "🔥", "🏆", "👍", "👎"];

export const ChatModal: React.FC = () => {
  const activeModal = useGameStore((s) => s.activeModal);
  const setActiveModal = useGameStore((s) => s.setActiveModal);
  const chatMessages = useGameStore((s) => s.chatMessages);
  const markChatRead = useGameStore((s) => s.markChatRead);
  const myPlayerId = useGameStore((s) => s.playerId);
  const [inputText, setInputText] = useState("");

  if (activeModal !== "chat") return null;

  const handleSendText = () => {
    if (inputText.trim()) {
      socketService.sendChat(inputText.trim());
      setInputText("");
    }
  };

  const handleSendEmoji = (emoji: string) => {
    socketService.sendChat(emoji, emoji);
  };

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={() => {
        markChatRead();
        setActiveModal(null);
      }}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>MATCH CHAT & REACTIONS</Text>
            <TouchableOpacity
              onPress={() => {
                markChatRead();
                setActiveModal(null);
              }}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Reaction Emojis */}
          <View style={styles.emojiRow}>
            {QUICK_EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={`emoji-${emoji}`}
                style={styles.emojiBtn}
                onPress={() => handleSendEmoji(emoji)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Messages Log */}
          <ScrollView style={styles.messagesList} contentContainerStyle={styles.messagesContent}>
            {chatMessages.length === 0 ? (
              <Text style={styles.emptyNotice}>No messages yet. Send a quick emoji!</Text>
            ) : (
              chatMessages.map((msg) => {
                const isMe = msg.senderId === myPlayerId;
                return (
                  <View
                    key={msg.id}
                    style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleOther]}
                  >
                    <Text style={styles.senderName}>{isMe ? "You" : msg.senderName}</Text>
                    <Text style={styles.msgText}>{msg.message}</Text>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Text Input Row */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Type message..."
              placeholderTextColor="#64748b"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSendText}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendText}>
              <Text style={styles.sendBtnText}>SEND</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: "#0f172a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 2,
    borderTopColor: "#334155",
    height: "60%",
    padding: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  closeIcon: {
    color: "#94a3b8",
    fontSize: 16,
    fontWeight: "bold",
  },
  emojiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#1e293b",
    padding: 8,
    borderRadius: 10,
    marginBottom: 10,
  },
  emojiBtn: {
    padding: 4,
  },
  emojiText: {
    fontSize: 22,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    gap: 8,
    paddingVertical: 6,
  },
  emptyNotice: {
    color: "#64748b",
    textAlign: "center",
    marginTop: 20,
    fontSize: 12,
  },
  msgBubble: {
    padding: 10,
    borderRadius: 12,
    maxWidth: "80%",
  },
  msgBubbleMe: {
    alignSelf: "flex-end",
    backgroundColor: "#2563eb",
  },
  msgBubbleOther: {
    alignSelf: "flex-start",
    backgroundColor: "#1e293b",
  },
  senderName: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 2,
  },
  msgText: {
    color: "#ffffff",
    fontSize: 14,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    paddingHorizontal: 12,
    color: "#ffffff",
    fontSize: 14,
  },
  sendBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 13,
  },
});
