import React from 'react';
import { Modal, View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { useAlertStore } from '../store/alertStore';

export const CustomAlertModal = () => {
  const { isVisible, title, message, buttons, options, hideAlert } = useAlertStore();

  if (Platform.OS !== 'web' || !isVisible) return null;

  return (
    <Modal transparent={true} visible={isVisible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          <Text style={styles.title}>{title}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}
          
          <View style={styles.buttonContainer}>
            {buttons.map((btn, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  btn.style === 'destructive' ? styles.destructiveButton : undefined,
                  btn.style === 'cancel' ? styles.cancelButton : undefined,
                ]}
                onPress={() => {
                  hideAlert();
                  if (btn.onPress) btn.onPress();
                }}
              >
                <Text style={[
                  styles.buttonText,
                  btn.style === 'destructive' ? styles.destructiveText : undefined,
                  btn.style === 'cancel' ? styles.cancelText : undefined,
                ]}>
                  {btn.text || 'OK'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 99999,
  },
  alertBox: {
    backgroundColor: '#1F2937', // dark bg
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#374151',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F3F4F6',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#D1D5DB',
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6B7280',
  },
  destructiveButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelText: {
    color: '#D1D5DB',
  },
  destructiveText: {
    color: '#FFF',
  }
});
