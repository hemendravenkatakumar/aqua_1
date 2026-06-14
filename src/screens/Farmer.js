import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../comps/Header';
import Nav from '../comps/Nav';
import ProfileModal from '../comps/Profile';
import Weight from '../tabs/Weight';
import Calc from '../tabs/Calc';
import History from '../tabs/History';
import AI from '../tabs/AI';
import client from '../api/client';
import { GREEN, TRANSLATIONS } from '../constants';

export default function Farmer({ navigation }) {
  const [tab, setTab] = useState('weight');
  const [user, setUser] = useState(null);
  const [profileVisible, setProfileVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('en');

  const loadLang = async () => {
    const saved = await AsyncStorage.getItem('user_lang');
    if (saved) setLang(saved);
  };

  const fetchProfile = async () => {
    try {
      const res = await client.get('/me/');
      setUser(res.data);
    } catch (e) {
      console.log('Error getting farmer profile', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    loadLang();
  }, []);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('auth_token');
            await AsyncStorage.removeItem('profile_setup');
            navigation.reset({
              index: 0,
              routes: [{ name: 'Role' }],
            });
          } catch (e) {
            console.log('Error logging out', e);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={GREEN} />
      </View>
    );
  }

  const tabs = ['weight', 'calc', 'history', 'ai'];
  const icons = ['⚖️', '🧮', '📋', '🤖'];
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const labels = [t.weight, t.calc, t.history, t.ai];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={GREEN} />
      <Header
        title="AquaSetu"
        name={user?.name}
        role="farmer"
        onProfilePress={() => setProfileVisible(true)}
      />

      <View style={styles.content}>
        {tab === 'weight' && <Weight role="farmer" lang={lang} />}
        {tab === 'calc' && <Calc lang={lang} />}
        {tab === 'history' && <History />}
        {tab === 'ai' && <AI />}
      </View>

      <Nav
        tabs={tabs}
        icons={icons}
        labels={labels}
        activeTab={tab}
        onTabSelect={setTab}
      />

      <ProfileModal
        visible={profileVisible}
        onClose={() => {
          setProfileVisible(false);
          loadLang();
        }}
        user={user}
        onSave={(updatedUser) => {
          setUser(updatedUser);
          loadLang();
        }}
        onLogout={handleLogout}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
});
