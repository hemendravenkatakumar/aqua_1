import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GREEN, GREEN_LIGHT, BORDER_COLOR, TEXT_DARK, TEXT_LIGHT, TRANSLATIONS } from '../constants';

export default function Role({ navigation }) {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    AsyncStorage.getItem('user_lang').then(savedLang => {
      if (savedLang) setLang(savedLang);
    });
  }, []);

  const selectRole = async (role) => {
    try {
      await AsyncStorage.setItem('user_role', role);
      navigation.navigate('Login');
    } catch (e) {
      console.log('Error saving role', e);
    }
  };

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.emoji}>💼</Text>
        <Text style={styles.title}>{t.selectRole}</Text>
        <Text style={styles.subtitle}>AquaSetu Weighbridge Management</Text>
      </View>

      <View style={styles.options}>
        {/* Farmer Button */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.roleCard, styles.farmerCard]}
          onPress={() => selectRole('farmer')}
        >
          <Text style={styles.cardIcon}>👨‍🌾</Text>
          <Text style={styles.cardTitle}>{t.farmer}</Text>
          <Text style={styles.cardDesc}>Weigh fish bags, track daily totals, and consult AI advisory</Text>
        </TouchableOpacity>

        {/* Buyer Button */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.roleCard, styles.buyerCard]}
          onPress={() => selectRole('buyer')}
        >
          <Text style={styles.cardIcon}>🚛</Text>
          <Text style={styles.cardTitle}>{t.buyer}</Text>
          <Text style={styles.cardDesc}>Manage transport fleets, record weights into vehicles, and review charts</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    backgroundColor: GREEN_LIGHT,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: GREEN,
  },
  subtitle: {
    fontSize: 12,
    color: TEXT_LIGHT,
    marginTop: 4,
  },
  options: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    gap: 16,
  },
  roleCard: {
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  farmerCard: {
    borderColor: GREEN,
  },
  buyerCard: {
    borderColor: '#3b82f6',
  },
  cardIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: TEXT_DARK,
  },
  cardDesc: {
    fontSize: 11,
    color: TEXT_LIGHT,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
  },
});
