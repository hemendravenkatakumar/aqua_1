import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LANGS, GREEN, GREEN_LIGHT, BORDER_COLOR, TEXT_DARK, TEXT_LIGHT } from '../constants';
import Btn from '../comps/Btn';

export default function Lang({ navigation }) {
  const selectLanguage = async (code) => {
    try {
      await AsyncStorage.setItem('user_lang', code);
      navigation.navigate('Role');
    } catch (e) {
      console.log('Error saving language selection', e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.emoji}>🌍</Text>
        <Text style={styles.title}>Select Language</Text>
        <Text style={styles.subtitle}>భాషను ఎంచుకోండి / भाषा चुनें</Text>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {LANGS.map((l) => (
          <TouchableOpacity
            key={l.code}
            activeOpacity={0.85}
            style={styles.langCard}
            onPress={() => selectLanguage(l.code)}
          >
            <Text style={styles.nativeText}>{l.native}</Text>
            <Text style={styles.englishText}>{l.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
    fontSize: 14,
    color: TEXT_LIGHT,
    marginTop: 4,
  },
  grid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  langCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: BORDER_COLOR,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  nativeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GREEN,
  },
  englishText: {
    fontSize: 12,
    color: TEXT_LIGHT,
    marginTop: 4,
  },
});
