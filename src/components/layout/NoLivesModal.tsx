// src/components/layout/NoLivesModal.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Modal, StyleSheet, Button } from 'react-native';
import { useSettings } from '../../hooks/useSettings';
import { usePlayer } from '../../hooks/usePlayer';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = {
  visible: boolean;
  onClose: () => void;
};

// Fonction pour formater le temps
const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const NoLivesModal = ({ visible, onClose }: Props) => {
  const { theme } = useSettings();
  const { lives, regenJobs, rechargeLivesWithGame,rechargeLivesWithXP, isRecharging } = usePlayer();
  const [timeLeft, setTimeLeft] = useState('00:00');

  useEffect(() => {
    if (visible && regenJobs.length > 0) {
      const firstJob = regenJobs[0];
      const updateTimer = () => {
        const remaining = firstJob.endTime - Date.now();
        if (remaining <= 0) {
          setTimeLeft('00:00');
          // Le contexte Player gérera la recharge, on ferme le modal
          onClose();
        } else {
          setTimeLeft(formatTime(remaining));
        }
      };
      
      updateTimer(); // Appel immédiat
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [visible, regenJobs, onClose]);
  
  const canRecharge = lives < 5;

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: theme.card }]}>
          <Text style={[styles.title, { color: theme.text }]}>Plus de vies !</Text>
          <MaterialCommunityIcons name="heart-broken" size={60} color={theme.error} />
          
          <Text style={[styles.message, { color: theme.text }]}>
            Vous n'avez plus de vies. Revenez plus tard ou rechargez-les.
          </Text>
          
          <View style={styles.timerBox}>
            <Text style={[styles.timerLabel, { color: theme.text }]}>Prochaine vie dans :</Text>
            <Text style={[styles.timer, { color: theme.primary }]}>{timeLeft}</Text>
          </View>
          
          {/* <Button
            title="Recharger mes vies"
            onPress={rechargeLivesWithGame}
            disabled={!canRecharge || isRecharging}
            color={theme.primary}
          /> */}

          {/* NOUVEAU BOUTON : Recharge complète contre 450 XP */}
          <View style={styles.buttonContainer}>
            <Button
              title="Recharger complètement (450 XP)"
              onPress={rechargeLivesWithXP}
              disabled={!canRecharge}
              color={theme.accent} // Utilisation de la couleur accent pour différencier
            />
          </View>

          <View style={{ marginTop: 10 }}>
            <Button title="Fermer" onPress={onClose} color={theme.text} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    marginVertical: 5, // Ajoute un petit espace vertical
    width: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    width: '85%',
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 15,
  },
  timerBox: {
    alignItems: 'center',
    marginVertical: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  timerLabel: {
    fontSize: 14,
  },
  timer: {
    fontSize: 30,
    fontWeight: 'bold',
  },
});

export default NoLivesModal;