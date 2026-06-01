import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GREEN, GREEN_LIGHT, BORDER_COLOR, TEXT_DARK, TEXT_LIGHT, TRANSLATIONS } from '../constants';
import Btn from '../comps/Btn';
import client, { setBackendIP } from '../api/client';
import auth from '../../firebase';

export default function Login({ navigation }) {
  const [lang, setLang] = useState('en');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [ipAddress, setIpAddress] = useState('192.168.1.7'); // Default placeholder IP
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('user_lang').then(savedLang => {
      if (savedLang) setLang(savedLang);
    });
    AsyncStorage.getItem('backend_ip').then(savedIp => {
      if (savedIp) setIpAddress(savedIp);
    });
  }, []);

  const handleSendOTP = async () => {
    if (phone.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    
    setLoading(true);
    try {
      await setBackendIP(ipAddress);
      
      if (!auth) {
        throw new Error("Native auth module not found in Expo Go");
      }
      
      const formatPhone = `+91${phone}`;
      // Trigger real SMS code via Firebase Native Auth
      const confirmation = await auth().signInWithPhoneNumber(formatPhone);
      setConfirm(confirmation);
      setCodeSent(true);
      Alert.alert('OTP Sent', `Verification code sent to +91 ${phone}.`);
    } catch (e) {
      console.log('Error triggering OTP', e);
      // Fallback for sandboxed developer checks & Expo Go missing native module
      setCodeSent(true);
      Alert.alert(
        'Simulated Mode (Expo Go)',
        `Running in Expo Go (simulated SMS). Verification code set to: 123456`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      let idToken;
      if (otp === '123456' && !confirm) {
        // Dev bypass
        idToken = `test-token-${otp}`;
      } else {
        // Real phone confirmation
        const credential = await confirm.confirm(otp);
        idToken = await credential.user.getIdToken();
      }
      
      const res = await client.post('/verify-otp/', {
        id_token: idToken,
        phone: `+91${phone}`,
      });

      const { token, new_user, user } = res.data;
      
      // Save credentials in local storage
      await AsyncStorage.setItem('auth_token', token);
      await AsyncStorage.setItem('user_phone', user.phone);
      await AsyncStorage.setItem('user_role', user.role || 'farmer'); // fallback/default

      if (new_user || !user.name || !user.role) {
        navigation.replace('Signup');
      } else {
        await AsyncStorage.setItem('profile_setup', 'done');
        navigation.replace(user.role === 'farmer' ? 'Farmer' : 'Buyer');
      }
    } catch (e) {
      console.log('Verification error', e);
      Alert.alert('Verification Failed', 'Invalid OTP code or Server connection refused. Please verify your Django Backend Server IP is correct and running.');
    } finally {
      setLoading(false);
    }
  };

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topSection}>
          <Text style={styles.emoji}>🔐</Text>
          <Text style={styles.title}>{t.login}</Text>
          <Text style={styles.subtitle}>Firebase Secure Authentication</Text>
        </View>

        <View style={styles.form}>
          {/* Server Config (crucial for local testing between phone/backend) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>🔧 Django Backend IP (WiFi Local IP)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 192.168.1.5"
              value={ipAddress}
              onChangeText={setIpAddress}
            />
            <Text style={styles.helperText}>
              Your computer's IP address on your home WiFi network.
            </Text>
          </View>

          {!codeSent ? (
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
              <Btn title={t.sendOTP} onPress={handleSendOTP} loading={loading} style={styles.submitBtn} />
            </View>
          ) : (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.enterOTP}</Text>
              <TextInput
                style={styles.input}
                placeholder="123456"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
              />
              <Btn title={t.verifyOTP} onPress={handleVerifyOTP} loading={loading} style={styles.submitBtn} />
              
              <TouchableOpacity onPress={() => setCodeSent(false)} style={styles.changePhoneBtn}>
                <Text style={styles.changePhoneText}>⬅ Change Phone Number</Text>
              </TouchableOpacity>
            </View>
          )}
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
  helperText: {
    fontSize: 11,
    color: TEXT_LIGHT,
    marginTop: 4,
  },
  submitBtn: {
    marginTop: 16,
  },
  changePhoneBtn: {
    alignItems: 'center',
    marginTop: 16,
  },
  changePhoneText: {
    fontSize: 13,
    color: GREEN,
    fontWeight: '600',
  },
});
