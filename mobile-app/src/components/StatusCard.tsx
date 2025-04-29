import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatusCardProps {
  title: string;
  icon: string;
  iconColor?: string;
  children: ReactNode;
}

/**
 * Status card component for displaying metrics
 */
const StatusCard: React.FC<StatusCardProps> = ({ 
  title, 
  icon, 
  iconColor = '#4CAF50', 
  children 
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name={icon as any} size={24} color={iconColor} style={styles.icon} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    alignItems: 'center',
  },
});

export default StatusCard;