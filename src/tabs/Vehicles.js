import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { FISH_KEYS, FISH_NAMES, FISH_EMOJI, GREEN, GREEN_LIGHT, BORDER_COLOR, TEXT_DARK, TEXT_LIGHT } from '../constants';
import client from '../api/client';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await client.get('/vehicles/');
      setVehicles(res.data);
    } catch (e) {
      console.log('Error fetching vehicles', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVehicles();
    setRefreshing(false);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      const res = await client.post('/vehicles/', {
        name: newName.trim(),
        fish: 'rohu',
      });
      setVehicles(prev => [res.data, ...prev]);
      setNewName('');
      setShowAdd(false);
    } catch (e) {
      console.log('Error adding vehicle', e);
      Alert.alert('Error', 'Failed to add vehicle.');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'done' : 'active';
    try {
      const res = await client.put(`/vehicles/${id}/`, {
        status: nextStatus,
      });
      setVehicles(prev => prev.map(v => (v.id === id ? res.data : v)));
    } catch (e) {
      console.log('Error toggling vehicle status', e);
      Alert.alert('Error', 'Failed to update status.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await client.delete(`/vehicles/${id}/`);
      setVehicles(prev => prev.filter(v => v.id !== id));
    } catch (e) {
      console.log('Error deleting vehicle', e);
      Alert.alert('Error', 'Failed to delete vehicle.');
    }
  };

  const totalKg = vehicles.reduce((sum, v) => sum + v.kg, 0);
  const totalBags = vehicles.reduce((sum, v) => sum + v.bags, 0);
  const activeCount = vehicles.filter(v => v.status === 'active').length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[GREEN]} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚛 Fleet Management</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(!showAdd)}>
          <Text style={styles.addBtnTxt}>+ Add Vehicle</Text>
        </TouchableOpacity>
      </View>

      {/* Summary grid */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{vehicles.length}</Text>
          <Text style={styles.statLabel}>Vehicles</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statVal, { color: GREEN }]}>{activeCount}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statVal, { color: '#b45309' }]}>{totalKg} kg</Text>
          <Text style={styles.statLabel}>Total Weight</Text>
        </View>
      </View>

      {/* Add vehicle form */}
      {showAdd && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Enter Vehicle Number / Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. AP 32 AB 1234"
            value={newName}
            onChangeText={setNewName}
            autoFocus
          />
          <View style={styles.formBtns}>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleAdd}>
              <Text style={styles.confirmBtnTxt}>Add Vehicle ✓</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setShowAdd(false);
                setNewName('');
              }}
            >
              <Text style={styles.cancelBtnTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading && vehicles.length === 0 ? (
        <ActivityIndicator size="large" color={GREEN} style={{ marginTop: 20 }} />
      ) : vehicles.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🚛</Text>
          <Text style={styles.emptyText}>No vehicles registered yet</Text>
          <Text style={styles.emptySubText}>Add a vehicle above to start loading bags.</Text>
        </View>
      ) : (
        vehicles.map((v) => {
          const isActive = v.status === 'active';
          return (
            <View key={v.id} style={[styles.vehCard, isActive && styles.activeCard]}>
              <View style={styles.cardHeader}>
                <View style={styles.vehInfo}>
                  <View style={[styles.iconBox, isActive && styles.activeIconBox]}>
                    <Text style={styles.icon}>🚛</Text>
                  </View>
                  <View>
                    <Text style={styles.vehName}>{v.name}</Text>
                    <View style={styles.statusRow}>
                      <View style={[styles.statusDot, { backgroundColor: isActive ? '#10b981' : '#cbd5e1' }]} />
                      <Text style={[styles.statusTxt, { color: isActive ? GREEN : TEXT_LIGHT }]}>
                        {v.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleDelete(v.id)} style={styles.deleteBtn}>
                  <Text style={styles.deleteTxt}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Specs strip */}
              <View style={styles.specsRow}>
                <View style={styles.specBox}>
                  <Text style={styles.specVal}>{v.bags}</Text>
                  <Text style={styles.specLabel}>Bags</Text>
                </View>
                <View style={styles.specBox}>
                  <Text style={styles.specVal}>{v.kg} kg</Text>
                  <Text style={styles.specLabel}>Weight</Text>
                </View>
                <View style={styles.specBox}>
                  <Text style={styles.specVal}>
                    {FISH_EMOJI[v.fish] || '🐟'} {FISH_NAMES[FISH_KEYS.indexOf(v.fish)] || 'Rohu'}
                  </Text>
                  <Text style={styles.specLabel}>Fish</Text>
                </View>
              </View>

              {/* Status toggle button */}
              <TouchableOpacity
                style={[styles.statusBtn, isActive ? styles.activeStatusBtn : styles.doneStatusBtn]}
                onPress={() => handleToggleStatus(v.id, v.status)}
              >
                <Text style={[styles.statusBtnTxt, isActive ? styles.activeStatusBtnTxt : styles.doneStatusBtnTxt]}>
                  {isActive ? '✅ Mark weighing session as Done' : '🔄 Reactivate vehicle'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fbf9',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: TEXT_DARK,
  },
  addBtn: {
    backgroundColor: GREEN,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    elevation: 2,
  },
  addBtnTxt: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -4,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  statLabel: {
    fontSize: 10,
    color: TEXT_LIGHT,
    marginTop: 2,
  },
  formCard: {
    backgroundColor: GREEN_LIGHT,
    borderWidth: 1.5,
    borderColor: GREEN + '50',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 8,
  },
  input: {
    height: 48,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  formBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  confirmBtn: {
    flex: 1,
    height: 42,
    backgroundColor: GREEN,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnTxt: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cancelBtn: {
    flex: 1,
    height: 42,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnTxt: {
    color: TEXT_LIGHT,
    fontSize: 14,
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: TEXT_DARK,
  },
  emptySubText: {
    fontSize: 12,
    color: TEXT_LIGHT,
    marginTop: 4,
  },
  vehCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },
  activeCard: {
    borderColor: GREEN + '40',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  activeIconBox: {
    backgroundColor: GREEN_LIGHT,
  },
  icon: {
    fontSize: 20,
  },
  vehName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: TEXT_DARK,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusTxt: {
    fontSize: 10,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 6,
    backgroundColor: '#fef2f2',
    borderRadius: 6,
  },
  deleteTxt: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 12,
  },
  specsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 8,
    marginBottom: 12,
  },
  specBox: {
    flex: 1,
    alignItems: 'center',
  },
  specVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: TEXT_DARK,
  },
  specLabel: {
    fontSize: 9,
    color: TEXT_LIGHT,
    marginTop: 2,
  },
  statusBtn: {
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  activeStatusBtn: {
    backgroundColor: GREEN_LIGHT,
    borderColor: GREEN,
  },
  doneStatusBtn: {
    backgroundColor: '#f8fafc',
    borderColor: BORDER_COLOR,
  },
  statusBtnTxt: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeStatusBtnTxt: {
    color: GREEN,
  },
  doneStatusBtnTxt: {
    color: TEXT_LIGHT,
  },
});
