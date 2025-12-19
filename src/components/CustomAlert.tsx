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
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

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

  // Configuration par type d'alerte - Couleurs améliorées
  const alertConfig = {
    info: { 
      icon: 'information-circle', 
      color: '#4361EE', 
      bgColor: '#EFF6FF',
      iconColor: '#3B82F6'
    },
    warning: { 
      icon: 'warning', 
      color: '#F59E0B', 
      bgColor: '#FFFBEB',
      iconColor: '#D97706'
    },
    error: { 
      icon: 'close-circle', 
      color: '#EF4444', 
      bgColor: '#FEF2F2',
      iconColor: '#DC2626'
    },
    success: { 
      icon: 'checkmark-circle', 
      color: '#10B981', 
      bgColor: '#ECFDF5',
      iconColor: '#059669'
    },
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
        {/* Fond semi-transparent */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleBackdropPress}
        />

        {/* Contenu de l'alerte */}
        <Animated.View
          style={[
            styles.alertContainer,
            {
              transform: [{ scale: scaleValue }],
              opacity: opacityValue,
            },
          ]}
        >
          {/* Icône circulaire en haut */}
          {showIcon && (
            <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
              <Ionicons
                name={config.icon as any}
                size={32}
                color={config.iconColor}
              />
            </View>
          )}

          {/* Contenu textuel */}
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>

          {/* Boutons d'action - ALIGNÉS À DROITE */}
          <View style={styles.buttonsContainer}>
            {buttons.map((button, index) => {
              const isCancel = button.style === 'cancel';
              const isDestructive = button.style === 'destructive';
              
              // Déterminer le style du bouton
              let buttonStyle = {};
              let textColor = config.color;

              if (isCancel) {
                buttonStyle = styles.buttonCancel;
                textColor = '#6B7280';
              } else if (isDestructive) {
                buttonStyle = styles.buttonDestructive;
                textColor = '#EF4444';
              } else {
                buttonStyle = styles.buttonDefault;
              }

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    buttonStyle,
                    index > 0 && { marginLeft: 10 }, // Espace entre boutons
                  ]}
                  onPress={() => handleButtonPress(button.onPress)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.buttonText,
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
    padding: 20,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  alertContainer: {
    width: Platform.OS === 'web' ? '30%' : '85%',
    maxWidth: 450,
    minWidth: Platform.OS === 'web' ? 350 : 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 28,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    color: '#6B7280',
    textAlign: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // BOUTONS À DROITE
    width: '100%',
  },
  button: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  buttonDefault: {
    backgroundColor: '#F3F4F6',
  },
  buttonCancel: {
    backgroundColor: 'transparent',
    borderColor: '#E5E7EB',
  },
  buttonDestructive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default CustomAlert;