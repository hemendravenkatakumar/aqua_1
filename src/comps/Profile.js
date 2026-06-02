import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { GREEN, BORDER_COLOR, TEXT_DARK, TEXT_LIGHT } from '../constants';
import Btn from './Btn';
import client, { setBackendIP } from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Profile({ visible, onClose, user, onSave, onLogout }) {
  const [name, setName] = useState(user?.name || '');
  const [loc, setLoc] = useState(user?.loc || '');
  const [exp, setExp] = useState(user?.exp || '');
  const [ipAddress, setIpAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [lang, setLang] = useState('en');
  const [autoTare, setAutoTare] = useState(true);
  const [soundAlert, setSoundAlert] = useState(true);

  React.useEffect(() => {
    if (user) {
      setName(user.name || '');
      setLoc(user.loc || '');
      setExp(user.exp || '');
    }
    // Load current base URL / IP
    AsyncStorage.getItem('backend_ip').then(savedIp => {
      if (savedIp) setIpAddress(savedIp);
    });
    // Load settings
    AsyncStorage.getItem('user_lang').then(val => { if (val) setLang(val); });
    AsyncStorage.getItem('app_auto_tare').then(val => { setAutoTare(val !== 'false'); });
    AsyncStorage.getItem('app_sound_alert').then(val => { setSoundAlert(val !== 'false'); });
  }, [user, visible]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save backend IP if updated
      if (ipAddress) {
        await setBackendIP(ipAddress);
      }
      
      // Save settings
      await AsyncStorage.setItem('user_lang', lang);
      await AsyncStorage.setItem('app_auto_tare', autoTare ? 'true' : 'false');
      await AsyncStorage.setItem('app_sound_alert', soundAlert ? 'true' : 'false');
      
      const res = await client.put('/me/', {
        name,
        loc,
        exp,
        lang,
      });
      onSave(res.data);
      Alert.alert('Success', 'Settings saved successfully!');
      onClose();
    } catch (e) {
      console.log('Error updating profile', e);
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>👤 Profile Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={user?.phone || ''}
                editable={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter full name"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                placeholder="Nellore, Andhra Pradesh"
                value={loc}
                onChangeText={setLoc}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Experience (Years)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 5"
                value={exp}
                onChangeText={setExp}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.divider} />

            {/* Language Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Language / భాష / भाषा</Text>
              <View style={styles.langRow}>
                {[{code:'en', label:'English'}, {code:'te', label:'తెలుగు'}, {code:'hi', label:'हिंदी'}].map(item => (
                  <TouchableOpacity
                    key={item.code}
                    style={[styles.langBtn, lang === item.code && styles.activeLangBtn]}
                    onPress={() => setLang(item.code)}
                  >
                    <Text style={[styles.langBtnTxt, lang === item.code && styles.activeLangBtnTxt]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Weighing Scale App Use Settings */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>App Use Settings</Text>
              <View style={styles.settingToggleRow}>
                <Text style={styles.settingToggleLabel}>Auto-Tare Weighing Scale</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.toggleSwitch, autoTare ? styles.toggleOn : styles.toggleOff]}
                  onPress={() => setAutoTare(!autoTare)}
                >
                  <View style={[styles.toggleThumb, autoTare ? styles.thumbOn : styles.thumbOff]} />
                </TouchableOpacity>
              </View>
              <View style={[styles.settingToggleRow, { marginTop: 10 }]}>
                <Text style={styles.settingToggleLabel}>Sound Beep on Bag Added</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.toggleSwitch, soundAlert ? styles.toggleOn : styles.toggleOff]}
                  onPress={() => setSoundAlert(!soundAlert)}
                >
                  <View style={[styles.toggleThumb, soundAlert ? styles.thumbOn : styles.thumbOff]} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>🔧 Developer: Backend Server IP</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 192.168.1.5"
                value={ipAddress}
                onChangeText={setIpAddress}
              />
              <Text style={styles.helperText}>
                Set your computer's local WiFi IP to connect Expo Go to Django.
              </Text>
            </View>

            <Btn title="Save Changes" onPress={handleSave} loading={saving} />
            
            <Btn
              title="Logout"
              secondary
              onPress={onLogout}
              style={styles.logoutBtn}
              textStyle={{ color: '#ef4444' }}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: TEXT_DARK,
  },
  closeBtn: {
    padding: 5,
  },
  closeText: {
    fontSize: 20,
    color: TEXT_LIGHT,
  },
  scrollContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_DARK,
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    color: TEXT_DARK,
  },
  disabledInput: {
    backgroundColor: '#f1f5f9',
    color: '#64748b',
  },
  helperText: {
    fontSize: 12,
    color: TEXT_LIGHT,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER_COLOR,
    marginVertical: 20,
  },
  logoutBtn: {
    borderColor: '#ef4444',
    marginTop: 10,
  },
  langRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  langBtn: {
    flex: 1,
    height: 40,
    borderWidth: 1.5,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  activeLangBtn: {
    borderColor: GREEN,
    backgroundColor: GREEN + '10',
  },
  langBtnTxt: {
    fontSize: 13,
    color: TEXT_LIGHT,
    fontWeight: '600',
  },
  activeLangBtnTxt: {
    color: GREEN,
    fontWeight: 'bold',
  },
  settingToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  settingToggleLabel: {
    fontSize: 13,
    color: TEXT_DARK,
    fontWeight: '500',
  },
  toggleSwitch: {
    width: 46,
    height: 26,
    borderRadius: 13,
    padding: 2,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: GREEN,
  },
  toggleOff: {
    backgroundColor: '#cbd5e1',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  thumbOn: {
    alignSelf: 'flex-end',
  },
  thumbOff: {
    alignSelf: 'flex-start',
  },
});
