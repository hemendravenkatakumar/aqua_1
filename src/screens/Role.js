import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GREEN, GREEN_LIGHT, BORDER_COLOR, TEXT_DARK, TEXT_LIGHT, TRANSLATIONS } from '../constants';

export default function Role({ navigation }) {
  const [lang, setLang] = useState('en');
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('user_lang').then(savedLang => {
      if (savedLang) setLang(savedLang);
    });
  }, []);

  const handleSelectRole = async (role) => {
    try {
      await AsyncStorage.setItem('user_role', role);
      setSelectedRole(role);
    } catch (e) {
      console.log('Error saving role', e);
    }
  };

  const handleClearRole = () => {
    setSelectedRole(null);
  };

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isFarmer = selectedRole === 'farmer';
  const portalTheme = isFarmer ? GREEN : '#3b82f6';
  const portalBg = isFarmer ? GREEN_LIGHT : '#eff6ff';

  return (
    <View style={styles.container}>
      <View style={[styles.topSection, selectedRole && { backgroundColor: portalBg }]}>
        <Text style={styles.emoji}>{selectedRole ? (isFarmer ? '👨‍🌾' : '🚛') : '💼'}</Text>
        <Text style={[styles.title, selectedRole && { color: portalTheme }]}>
          {selectedRole 
            ? (isFarmer ? t.farmerPortal : t.buyerPortal)
            : t.selectRole
          }
        </Text>
        <Text style={styles.subtitle}>
          {selectedRole ? t.rolePrompt : 'AquaSetu Weighbridge Management'}
        </Text>
      </View>

      {!selectedRole ? (
        <View style={styles.options}>
          {/* Farmer Button */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.roleCard, styles.farmerCard]}
            onPress={() => handleSelectRole('farmer')}
          >
            <Text style={styles.cardIcon}>👨‍🌾</Text>
            <Text style={styles.cardTitle}>{t.farmer}</Text>
            <Text style={styles.cardDesc}>Weigh fish bags, track daily totals, and consult AI advisory</Text>
          </TouchableOpacity>

          {/* Buyer Button */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.roleCard, styles.buyerCard]}
            onPress={() => handleSelectRole('buyer')}
          >
            <Text style={styles.cardIcon}>🚛</Text>
            <Text style={styles.cardTitle}>{t.buyer}</Text>
            <Text style={styles.cardDesc}>Manage transport fleets, record weights into vehicles, and review charts</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.portalOptions}>
          <Text style={styles.portalDesc}>
            {isFarmer 
              ? 'Access weighing tools, AI recommendations, and local batch history logs.' 
              : 'Monitor active transport fleets, weight records, and transaction logs.'
            }
          </Text>
          
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.portalBtn, { backgroundColor: portalTheme }]}
            onPress={() => navigation.navigate('Login', { role: selectedRole })}
          >
            <Text style={styles.portalBtnText}>{t.loginOnly}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.portalBtnOutlined, { borderColor: portalTheme }]}
            onPress={() => navigation.navigate('Signup', { role: selectedRole })}
          >
            <Text style={[styles.portalBtnOutlinedText, { color: portalTheme }]}>{t.signupOnly}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleClearRole} style={styles.backLink}>
            <Text style={[styles.backLinkText, { color: portalTheme }]}>⬅ {t.goBack}</Text>
          </TouchableOpacity>
        </View>
      )}
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
  portalOptions: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  portalDesc: {
    fontSize: 14,
    color: TEXT_LIGHT,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  portalBtn: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  portalBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  portalBtnOutlined: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  portalBtnOutlinedText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  backLink: {
    marginTop: 20,
    padding: 8,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
