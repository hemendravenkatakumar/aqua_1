import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { FISH_KEYS, FISH_NAMES, FISH_EMOJI, GREEN, GREEN_LIGHT, BORDER_COLOR, TEXT_DARK, TEXT_LIGHT } from '../constants';
import client from '../api/client';

export default function Weight({ role, lang }) {
  const [liveKg, setLiveKg] = useState(24.5);
  const [fish, setFish] = useState('rohu');
  const [bags, setBags] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selVehId, setSelVehId] = useState(null);
  const [showAddVeh, setShowAddVeh] = useState(false);
  const [newVehName, setNewVehName] = useState('');
  const [pulsing, setPulsing] = useState(false);
  const [flash, setFlash] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isBtConnected, setIsBtConnected] = useState(true);
  const [btConnecting, setBtConnecting] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    total_bags: 0,
    total_weight: 0.0,
    avg_weight: 0.0,
    total_amount: 0.0,
  });

  // Random weight simulator (Bluetooth active weight scale simulation)
  useEffect(() => {
    if (!isBtConnected) {
      setLiveKg(0.0);
      return;
    }
    const interval = setInterval(() => {
      const min = 15;
      const max = 38;
      const val = +(Math.random() * (max - min) + min).toFixed(1);
      setLiveKg(val);
      setPulsing(true);
      setTimeout(() => setPulsing(false), 300);
    }, 4000);
    return () => clearInterval(interval);
  }, [isBtConnected]);

  const handleConnectBt = () => {
    setBtConnecting(true);
    setTimeout(() => {
      setIsBtConnected(true);
      setBtConnecting(false);
      setLiveKg(24.5);
    }, 1500);
  };

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch bags
      const bagsRes = await client.get('/bags/');
      setBags(bagsRes.data);
      
      // Fetch stats
      const statsRes = await client.get('/bags/stats/');
      setStats(statsRes.data);
      
      // Fetch vehicles if buyer
      if (role === 'buyer') {
        const vehRes = await client.get('/vehicles/');
        setVehicles(vehRes.data.filter(v => v.status === 'active'));
      }
    } catch (e) {
      console.log('Error fetching bags data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [role]);

  const handleAddVehicle = async () => {
    if (!newVehName.trim()) return;
    try {
      const res = await client.post('/vehicles/', {
        name: newVehName.trim(),
        fish: fish,
      });
      setVehicles(prev => [res.data, ...prev]);
      setSelVehId(res.data.id);
      setNewVehName('');
      setShowAddVeh(false);
    } catch (e) {
      console.log('Error adding vehicle', e);
      Alert.alert('Error', 'Failed to add vehicle.');
    }
  };

  const handleAddBag = async () => {
    if (role === 'buyer' && !selVehId) {
      Alert.alert('Warning', 'Please select a vehicle first!');
      return;
    }
    if (!isBtConnected) {
      Alert.alert('Warning', 'Please connect the Bluetooth scale first!');
      return;
    }
    
    try {
      setFlash(true);
      const price = 28.0; // default standard price/kg
      const res = await client.post('/bags/', {
        fish,
        weight: liveKg,
        price,
        veh_id: role === 'buyer' ? selVehId : null,
      });
      
      // Flash UI effect
      setTimeout(() => setFlash(false), 500);
      
      // Refresh statistics and list
      fetchData();
    } catch (e) {
      setFlash(false);
      console.log('Error adding bag', e);
      Alert.alert('Error', 'Failed to save bag weight.');
    }
  };

  const handleDeleteBag = async (id) => {
    try {
      await client.delete(`/bags/${id}/`);
      fetchData();
    } catch (e) {
      console.log('Error deleting bag', e);
      Alert.alert('Error', 'Failed to delete bag.');
    }
  };

  const handleSaveBatch = async () => {
    if (bags.length === 0) {
      Alert.alert('Warning', 'No bags to save in this batch!');
      return;
    }
    
    try {
      const batchName = `${role === 'farmer' ? 'Farmer' : 'Buyer'} Batch - ${new Date().toLocaleDateString()}`;
      await client.post('/batches/', {
        name: batchName,
        fish: fish,
        bags: totalBags,
        kg: totalWeight,
        amt: totalValue,
      });
      
      Alert.alert('Success', 'Batch session saved to history successfully!');
      
      // Optional: Clear active bags in backend if needed. In this schema, 
      // we let the user start a fresh day or sessions. Let's clear the today bags list.
      // For simplicity, we can let user delete bags if they want to clear, or reset locally.
      fetchData();
    } catch (e) {
      console.log('Error saving batch', e);
      Alert.alert('Error', 'Failed to save batch session.');
    }
  };

  const activeVehicle = vehicles.find(v => v.id === selVehId);

  // Dynamic stats calculation
  const totalBags = bags.length;
  const totalWeight = bags.reduce((acc, b) => acc + b.weight, 0);
  const selectedFishWeight = bags.filter(b => b.fish === fish).reduce((acc, b) => acc + b.weight, 0);
  const totalValue = bags.reduce((acc, b) => acc + b.weight * (b.price || 28.0), 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      
      {/* Bluetooth scale card */}
      <View style={[styles.scaleCard, !isBtConnected && styles.scaleCardDisconnected]}>
        <View style={styles.cardHeader}>
          <View style={[styles.glowDot, { backgroundColor: isBtConnected ? '#34d399' : '#ef4444' }]} />
          <Text style={styles.cardHeaderTxt}>
            {isBtConnected ? 'Bluetooth Connected (Scale Pro)' : 'Bluetooth Disconnected'}
          </Text>
        </View>
        
        {isBtConnected ? (
          <>
            <Text style={styles.cardSub}>CURRENT BAG WEIGHT</Text>
            <View style={[styles.weightContainer, pulsing && styles.pulsingWeight]}>
              <Text style={styles.weightNum}>{liveKg}</Text>
              <Text style={styles.weightUnit}>kg</Text>
            </View>
            <View style={styles.scaleCardActions}>
              <Text style={styles.scaleFooter}>⚖️ Active Scale Auto-Taring</Text>
              <TouchableOpacity onPress={() => setIsBtConnected(false)} style={styles.disconnectBtn}>
                <Text style={styles.disconnectBtnTxt}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.disconnectedContainer}>
            <Text style={styles.disconnectedTxt}>No weighing scale connected.</Text>
            <TouchableOpacity
              style={styles.connectBtn}
              onPress={handleConnectBt}
              disabled={btConnecting}
            >
              {btConnecting ? (
                <ActivityIndicator size="small" color={GREEN} />
              ) : (
                <Text style={styles.connectBtnTxt}>🔌 Connect Weight Scale</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Vehicle selector (Buyer only) */}
      {role === 'buyer' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚛 SELECT ACTIVE VEHICLE</Text>
          <View style={styles.chipsContainer}>
            {vehicles.map(v => {
              const isSelected = selVehId === v.id;
              return (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.chip, isSelected && styles.activeChip]}
                  onPress={() => setSelVehId(isSelected ? null : v.id)}
                >
                  <Text style={[styles.chipText, isSelected && styles.activeChipText]}>
                    🚛 {v.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
            
            {!showAddVeh && (
              <TouchableOpacity
                style={[styles.chip, styles.dashedChip]}
                onPress={() => setShowAddVeh(true)}
              >
                <Text style={styles.dashedChipText}>➕ Add Vehicle</Text>
              </TouchableOpacity>
            )}
          </View>

          {showAddVeh && (
            <View style={styles.addVehBox}>
              <Text style={styles.addVehTitle}>Vehicle Number / Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. AP 32 AB 1234"
                value={newVehName}
                onChangeText={setNewVehName}
                autoFocus
              />
              <View style={styles.addVehBtns}>
                <TouchableOpacity style={styles.btnConfirm} onPress={handleAddVehicle}>
                  <Text style={styles.btnConfirmTxt}>Add & Select</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnCancel}
                  onPress={() => {
                    setShowAddVeh(false);
                    setNewVehName('');
                  }}
                >
                  <Text style={styles.btnCancelTxt}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {activeVehicle && !showAddVeh && (
            <Text style={styles.selectedVehText}>
              Selected: {activeVehicle.name} • {activeVehicle.bags} bags • {activeVehicle.kg} kg
            </Text>
          )}
        </View>
      )}

      {/* Fish selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SELECT FISH TYPE</Text>
        <View style={styles.chipsContainer}>
          {FISH_KEYS.map((k, idx) => {
            const isSelected = fish === k;
            return (
              <TouchableOpacity
                key={k}
                style={[styles.chip, isSelected && styles.activeChip]}
                onPress={() => setFish(k)}
              >
                <Text style={[styles.chipText, isSelected && styles.activeChipText]}>
                  {FISH_EMOJI[k]} {FISH_NAMES[idx]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{totalBags}</Text>
            <Text style={styles.statLabel}>Total Bags</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: GREEN }]}>{totalWeight.toFixed(1)} kg</Text>
            <Text style={styles.statLabel}>Total Weight</Text>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: GREEN }]}>{selectedFishWeight.toFixed(1)} kg</Text>
            <Text style={styles.statLabel}>{FISH_NAMES[FISH_KEYS.indexOf(fish)]} Weight</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: '#b45309' }]}>₹{totalValue.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Total Value (Est)</Text>
          </View>
        </View>
      </View>

      {/* Warning */}
      {role === 'buyer' && !selVehId && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>⚠️ Select an active vehicle above to load bags</Text>
        </View>
      )}

      {/* Add Bag Button */}
      <TouchableOpacity
        style={[
          styles.actionBtn,
          ((role === 'buyer' && !selVehId) || !isBtConnected) && styles.disabledBtn,
          flash && styles.flashBtn,
        ]}
        onPress={handleAddBag}
        disabled={(role === 'buyer' && !selVehId) || !isBtConnected}
      >
        <Text style={styles.actionBtnTxt}>
          {!isBtConnected
            ? '🔌 Connect Scale to Add Bag'
            : flash
            ? '✓ Bag Added!'
            : `+ Add Bag (${liveKg} kg) — ${FISH_NAMES[FISH_KEYS.indexOf(fish)]}`}
        </Text>
      </TouchableOpacity>

      {/* Save batch button */}
      {bags.length > 0 && (
        <TouchableOpacity style={styles.saveBatchBtn} onPress={handleSaveBatch}>
          <Text style={styles.saveBatchBtnTxt}>💾 Save Session to History</Text>
        </TouchableOpacity>
      )}

      {/* Active Bags List */}
      {bags.length > 0 && (
        <View style={styles.listSection}>
          <Text style={styles.listTitle}>RECENT BAGS</Text>
          {bags.map((b, idx) => (
            <View key={b.id} style={styles.bagRow}>
              <View style={styles.bagInfo}>
                <View style={styles.emojiContainer}>
                  <Text style={styles.emoji}>{FISH_EMOJI[b.fish]}</Text>
                </View>
                <View>
                  <Text style={styles.bagName}>
                    Bag {bags.length - idx} — {FISH_NAMES[FISH_KEYS.indexOf(b.fish)]}
                  </Text>
                  <Text style={styles.bagTime}>
                    {new Date(b.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
              <View style={styles.bagRight}>
                <Text style={styles.bagWeight}>{b.weight} kg</Text>
                <TouchableOpacity onPress={() => handleDeleteBag(b.id)} style={styles.deleteBtn}>
                  <Text style={styles.deleteText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
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
  scaleCard: {
    backgroundColor: GREEN,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  glowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34d399',
    marginRight: 6,
  },
  cardHeaderTxt: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  cardSub: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  weightContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 4,
  },
  pulsingWeight: {
    transform: [{ scale: 1.03 }],
  },
  weightNum: {
    fontSize: 48,
    fontWeight: '900',
    color: '#ffffff',
  },
  weightUnit: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 6,
    fontWeight: 'bold',
  },
  scaleFooter: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    marginTop: 6,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: TEXT_LIGHT,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  chip: {
    borderWidth: 1.5,
    borderColor: BORDER_COLOR,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
    margin: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeChip: {
    borderColor: GREEN,
    backgroundColor: GREEN,
  },
  dashedChip: {
    borderStyle: 'dashed',
    borderColor: GREEN,
    backgroundColor: GREEN_LIGHT,
  },
  chipText: {
    fontSize: 13,
    color: TEXT_DARK,
  },
  activeChipText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  dashedChipText: {
    color: GREEN,
    fontWeight: '600',
    fontSize: 13,
  },
  addVehBox: {
    backgroundColor: GREEN_LIGHT,
    borderWidth: 1,
    borderColor: GREEN + '50',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  addVehTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 6,
  },
  input: {
    height: 44,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 8,
  },
  addVehBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  btnConfirm: {
    flex: 1,
    height: 38,
    backgroundColor: GREEN,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnConfirmTxt: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  btnCancel: {
    flex: 1,
    height: 38,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancelTxt: {
    color: TEXT_LIGHT,
    fontSize: 13,
  },
  selectedVehText: {
    fontSize: 12,
    color: GREEN,
    fontWeight: 'bold',
    marginTop: 6,
  },
  statsGrid: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1.5,
  },
  scaleCardDisconnected: {
    backgroundColor: '#4b5563',
    shadowColor: '#4b5563',
  },
  scaleCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  disconnectBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  disconnectBtnTxt: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  disconnectedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  disconnectedTxt: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 14,
    fontWeight: '500',
  },
  connectBtn: {
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  connectBtnTxt: {
    color: GREEN,
    fontWeight: 'bold',
    fontSize: 13,
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
  warningBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fef3c7',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 12,
    color: '#d97706',
    fontWeight: '600',
  },
  actionBtn: {
    height: 52,
    backgroundColor: GREEN,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  disabledBtn: {
    backgroundColor: '#e2e8f0',
    elevation: 0,
    shadowOpacity: 0,
  },
  flashBtn: {
    backgroundColor: '#10b981',
  },
  actionBtnTxt: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  saveBatchBtn: {
    height: 46,
    borderWidth: 1.5,
    borderColor: GREEN,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  saveBatchBtnTxt: {
    color: GREEN,
    fontSize: 14,
    fontWeight: 'bold',
  },
  listSection: {
    marginTop: 8,
  },
  listTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: TEXT_LIGHT,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  bagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  bagInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojiContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: GREEN_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  emoji: {
    fontSize: 18,
  },
  bagName: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  bagTime: {
    fontSize: 10,
    color: TEXT_LIGHT,
    marginTop: 2,
  },
  bagRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bagWeight: {
    fontSize: 14,
    fontWeight: 'bold',
    color: GREEN,
    marginRight: 12,
  },
  deleteBtn: {
    padding: 6,
  },
  deleteText: {
    fontSize: 16,
  },
});
