// src/components/CustomAlert.tsx

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export interface AlertButton {
  text: string;
  onPress: () => void;
  style?: 'default' | 'cancel' | 'destructive';
  textColor?: string;
}

export interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: AlertButton[];
  onClose?: () => void;
  type?: 'info' | 'warning' | 'error' | 'success';
  showIcon?: boolean;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons = [{ text: 'OK', onPress: () => {} }],
  onClose,
  type = 'info',
  showIcon = true,
}) => {
  const scaleValue = new Animated.Value(0);
  const opacityValue = new Animated.Value(0);

  // Configuration par type d'alerte
  const alertConfig = {
    info: { icon: 'information', color: '#4361EE', bgColor: '#EFF2FF' },
    warning: { icon: 'alert', color: '#FF9800', bgColor: '#FFF3E0' },
    error: { icon: 'close-circle', color: '#F44336', bgColor: '#FFEBEE' },
    success: { icon: 'check-circle', color: '#4CAF50', bgColor: '#E8F5E8' },
  };

  const config = alertConfig[type];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          tension: 150,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 0,
          tension: 150,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleBackdropPress = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleButtonPress = (buttonAction: () => void) => {
    buttonAction();
    if (onClose) {
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: opacityValue,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backdropTouchable}
            activeOpacity={1}
            onPress={handleBackdropPress}
          />
        </Animated.View>

        <View style={styles.alertContainer}>
          <Animated.View
            style={[
              styles.alertBox,
              {
                transform: [{ scale: scaleValue }],
                opacity: opacityValue,
                backgroundColor: '#FFFFFF',
              },
            ]}
          >
            {/* En-tête de l'alerte */}
            <View style={[styles.header, { backgroundColor: config.bgColor }]}>
              {showIcon && (
                <MaterialCommunityIcons
                  name={config.icon as any}
                  size={28}
                  color={config.color}
                  style={styles.icon}
                />
              )}
              <Text style={styles.title}>{title}</Text>
            </View>

            {/* Corps du message */}
            <View style={styles.body}>
              <Text style={styles.message}>{message}</Text>
            </View>

            {/* Boutons d'action */}
            <View style={styles.buttonsContainer}>
              {buttons.map((button, index) => {
                const isCancel = button.style === 'cancel';
                const isDestructive = button.style === 'destructive';
                
                let buttonStyle = styles.buttonDefault;
                let textStyle = styles.buttonTextDefault;
                let textColor = config.color;

                if (isCancel) {
                  buttonStyle = styles.buttonCancel;
                  textStyle = styles.buttonTextCancel;
                  textColor = '#6B7280';
                } else if (isDestructive) {
                  buttonStyle = styles.buttonDestructive;
                  textStyle = styles.buttonTextDestructive;
                  textColor = '#F44336';
                }

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      buttonStyle,
                      index > 0 && styles.buttonSpacing,
                    ]}
                    onPress={() => handleButtonPress(button.onPress)}
                  >
                    <Text
                      style={[
                        textStyle,
                        { color: button.textColor || textColor },
                      ]}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropTouchable: {
    flex: 1,
    width: '100%',
  },
  alertContainer: {
    width: Platform.OS === 'web' ? '30%' : '85%',
    maxWidth: 400,
    minWidth: Platform.OS === 'web' ? 350 : 280,
    zIndex: 1000,
  },
  alertBox: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 15,
  },
  icon: {
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  body: {
    padding: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  message: {
    fontSize: 16,
    lineHeight: 22,
    color: '#4B5563',
    textAlign: 'left',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    paddingTop: 0,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonDefault: {
    backgroundColor: 'transparent',
  },
  buttonCancel: {
    backgroundColor: 'transparent',
  },
  buttonDestructive: {
    backgroundColor: 'transparent',
  },
  buttonSpacing: {
    marginLeft: 12,
  },
  buttonTextDefault: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  buttonTextDestructive: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
  },
});

export default CustomAlert;