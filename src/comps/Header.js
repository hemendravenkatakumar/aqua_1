import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GREEN, GREEN_LIGHT } from '../constants';

export default function Header({ title, onProfilePress, role, name }) {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>{title || 'AquaSetu'}</Text>
        {name ? (
          <Text style={styles.subtitle}>
            {name} • {role === 'farmer' ? 'రైతు' : 'కొనుగోలుదారు'}
          </Text>
        ) : null}
      </View>
      <TouchableOpacity onPress={onProfilePress} style={styles.profileBtn}>
        <Text style={styles.profileText}>👤</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 70,
    backgroundColor: GREEN,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 12,
    color: GREEN_LIGHT,
    marginTop: 2,
  },
  profileBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    fontSize: 18,
  },
});
