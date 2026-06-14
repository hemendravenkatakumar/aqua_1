import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GREEN, GREEN_LIGHT, BORDER_COLOR, TEXT_DARK, TEXT_LIGHT, TRANSLATIONS } from '../constants';
import Btn from '../comps/Btn';
import client from '../api/client';

export default function Login({ route, navigation }) {
  const [lang, setLang] = useState('en');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const { role: paramRole } = route.params || {};
  const [role, setRole] = useState(paramRole || 'farmer');

  useEffect(() => {
    AsyncStorage.getItem('user_lang').then(savedLang => {
      if (savedLang) setLang(savedLang);
    });
    if (paramRole) {
      setRole(paramRole);
    } else {
      AsyncStorage.getItem('user_role').then(savedRole => {
        if (savedRole) setRole(savedRole);
      });
    }
  }, [paramRole]);

  const handleLogin = async () => {
    if (phone.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (pin.length < 4) {
      Alert.alert('Invalid PIN', 'Please enter a 4-6 digit Passcode/PIN.');
      return;
    }

    setLoading(true);
    try {
      const res = await client.post('/login/', {
        phone: `+91${phone}`,
        pin: pin,
      });

      const { token, user } = res.data;

      // Save credentials in local storage
      await AsyncStorage.setItem('auth_token', token);
      await AsyncStorage.setItem('user_phone', user.phone);
      await AsyncStorage.setItem('user_role', user.role || role || 'farmer');
      await AsyncStorage.setItem('profile_setup', 'done');

      if (user.lang) {
        await AsyncStorage.setItem('user_lang', user.lang);
      }

      navigation.reset({
        index: 0,
        routes: [{ name: (user.role || role) === 'farmer' ? 'Farmer' : 'Buyer' }],
      });
    } catch (e) {
      console.log('Login error', e);
      const errMsg = e.response?.data?.error || 'Server connection refused. Please verify your Django Backend Server IP is correct and running.';
      Alert.alert('Login Failed', errMsg);
    } finally {
      setLoading(false);
    }
  };

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isFarmer = role === 'farmer';
  const themeColor = isFarmer ? GREEN : '#3b82f6';
  const themeLightBg = isFarmer ? GREEN_LIGHT : '#eff6ff';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.topSection, { backgroundColor: themeLightBg }]}>
          <Text style={styles.emoji}>{isFarmer ? '👨‍🌾' : '🚛'}</Text>
          <Text style={[styles.title, { color: themeColor }]}>
            {(isFarmer ? t.farmer : t.buyer) + " " + t.loginOnly}
          </Text>
          <Text style={styles.subtitle}>Secure PIN Authentication</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.enterPhone}</Text>
            <View style={styles.phoneInputRow}>
              <Text style={styles.prefix}>+91</Text>
              <TextInput
                style={[styles.input, styles.phoneInput]}
                placeholder="98765 43210"
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.enterPin}</Text>
            <TextInput
              style={styles.input}
              placeholder="••••"
              keyboardType="number-pad"
              secureTextEntry={true}
              maxLength={6}
              value={pin}
              onChangeText={setPin}
            />
          </View>

          <Btn
            title={t.loginOnly}
            onPress={handleLogin}
            loading={loading}
            style={[styles.submitBtn, { backgroundColor: themeColor }]}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scroll: {
    flexGrow: 1,
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
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
  },
  subtitle: {
    fontSize: 12,
    color: TEXT_LIGHT,
    marginTop: 4,
  },
  form: {
    padding: 24,
    marginTop: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_DARK,
    marginBottom: 6,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    paddingLeft: 12,
  },
  prefix: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_DARK,
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    height: 48,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 15,
    color: TEXT_DARK,
    backgroundColor: '#f8fafc',
  },
  submitBtn: {
    marginTop: 16,
  },
});
