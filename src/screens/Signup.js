import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GREEN, GREEN_LIGHT, BORDER_COLOR, TEXT_DARK, TEXT_LIGHT } from '../constants';
import Btn from '../comps/Btn';
import client from '../api/client';

export default function Signup({ navigation }) {
  const [name, setName] = useState('');
  const [loc, setLoc] = useState('');
  const [exp, setExp] = useState('');
  const [role, setRole] = useState('farmer');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('user_role').then(savedRole => {
      if (savedRole) setRole(savedRole);
    });
  }, []);

  const handleSave = async () => {
    if (!name.trim() || !loc.trim() || !exp.trim()) {
      Alert.alert('Incomplete Fields', 'Please fill in all the details.');
      return;
    }

    setLoading(true);
    try {
      // First update role in storage and server
      await AsyncStorage.setItem('user_role', role);
      
      const res = await client.put('/me/', {
        name: name.trim(),
        loc: loc.trim(),
        exp: exp.trim(),
        role: role,
      });

      await AsyncStorage.setItem('profile_setup', 'done');
      Alert.alert('Success', 'Profile created successfully!', [
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
      console.log('Error saving profile', e);
      Alert.alert('Error', 'Failed to save profile. Make sure the server is reachable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.topSection}>
        <Text style={styles.emoji}>👤</Text>
        <Text style={styles.title}>Profile Setup</Text>
        <Text style={styles.subtitle}>Tell us a bit about yourself</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Ravi Kumar"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location / Village</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Nellore, AP"
            value={loc}
            onChangeText={setLoc}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Farming/Weighing Experience (Years)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 5"
            keyboardType="numeric"
            value={exp}
            onChangeText={setExp}
          />
        </View>

        {/* Role toggle button in case they want to review */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Role Selection</Text>
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

        <Btn title="Complete Setup ✓" onPress={handleSave} loading={loading} style={styles.submitBtn} />
      </View>
    </ScrollView>
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
