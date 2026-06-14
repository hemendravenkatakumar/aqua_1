import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GREEN, GREEN_LIGHT, BORDER_COLOR, TEXT_DARK, TEXT_LIGHT, TRANSLATIONS } from '../constants';
import Btn from '../comps/Btn';
import client from '../api/client';

export default function Signup({ route, navigation }) {
  const [lang, setLang] = useState('en');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [loc, setLoc] = useState('');
  const [exp, setExp] = useState('');
  const { role: paramRole } = route.params || {};
  const [role, setRole] = useState(paramRole || 'farmer');
  const [loading, setLoading] = useState(false);

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

  const handleSave = async () => {
    if (phone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (pin.length < 4) {
      Alert.alert('Invalid PIN', 'Please choose a 4-6 digit Passcode/PIN.');
      return;
    }
    if (!name.trim() || !loc.trim() || !exp.trim()) {
      Alert.alert('Incomplete Fields', 'Please fill in all the details.');
      return;
    }

    setLoading(true);
    try {
      const res = await client.post('/register/', {
        phone: `+91${phone}`,
        pin: pin,
        name: name.trim(),
        role: role,
        loc: loc.trim(),
        exp: exp.trim(),
        lang: lang,
      });

      const { token, user } = res.data;

      // Save credentials in local storage
      await AsyncStorage.setItem('auth_token', token);
      await AsyncStorage.setItem('user_phone', user.phone);
      await AsyncStorage.setItem('user_role', user.role || role || 'farmer');
      await AsyncStorage.setItem('profile_setup', 'done');

      Alert.alert('Success', 'Account registered successfully!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: role === 'farmer' ? 'Farmer' : 'Buyer' }],
            });
          },
        },
      ]);
    } catch (e) {
      console.log('Error registering', e);
      const errMsg = e.response?.data?.error || 'Registration failed. Make sure the server is reachable and this phone number is not already registered.';
      Alert.alert('Registration Failed', errMsg);
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
          <Text style={styles.emoji}>👤</Text>
          <Text style={[styles.title, { color: themeColor }]}>{t.signupOnly}</Text>
          <Text style={styles.subtitle}>Create your AquaSetu account</Text>
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
            <Text style={styles.label}>{t.choosePin}</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 1234"
              keyboardType="number-pad"
              secureTextEntry={true}
              maxLength={6}
              value={pin}
              onChangeText={setPin}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.fullName}</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Ravi Kumar"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.location}</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Nellore, AP"
              value={loc}
              onChangeText={setLoc}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.experience}</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 5"
              keyboardType="numeric"
              value={exp}
              onChangeText={setExp}
            />
          </View>

          {/* Role selector in case they want to change it */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Selected Role</Text>
            <View style={styles.roleToggleRow}>
              <TouchableOpacity
                style={[styles.roleBtn, role === 'farmer' && styles.activeFarmerBtn]}
                onPress={() => setRole('farmer')}
              >
                <Text style={[styles.roleBtnTxt, role === 'farmer' && styles.activeRoleTxt]}>
                  👨‍🌾 Farmer (రైతు)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleBtn, role === 'buyer' && styles.activeBuyerBtn]}
                onPress={() => setRole('buyer')}
              >
                <Text style={[styles.roleBtnTxt, role === 'buyer' && styles.activeRoleTxt]}>
                  🚛 Buyer (కొనుగోలుదారు)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Btn
            title="Complete Setup ✓"
            onPress={handleSave}
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
  roleToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleBtn: {
    flex: 1,
    height: 44,
    borderWidth: 1.5,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  activeFarmerBtn: {
    borderColor: GREEN,
    backgroundColor: GREEN_LIGHT,
  },
  activeBuyerBtn: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  roleBtnTxt: {
    fontSize: 13,
    color: TEXT_LIGHT,
    fontWeight: '600',
  },
  activeRoleTxt: {
    color: TEXT_DARK,
    fontWeight: 'bold',
  },
  submitBtn: {
    marginTop: 10,
  },
});
