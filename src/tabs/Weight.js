import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { FISH_KEYS, FISH_NAMES, FISH_EMOJI, GREEN, GREEN_LIGHT, BORDER_COLOR, TEXT_DARK, TEXT_LIGHT, TRANSLATIONS } from '../constants';
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

  // Fetch initial data concurrently (Performance Optimization)
  const fetchData = async () => {
    setLoading(true);
    try {
      const promises = [
        client.get('/bags/'),
        client.get('/bags/stats/'),
      ];
      
      if (role === 'buyer') {
        // Retrieve only active vehicles directly from DB
        promises.push(client.get('/vehicles/?status=active'));
      }

      const results = await Promise.all(promises);

      setBags(results[0].data);
      setStats(results[1].data);
      
      if (role === 'buyer' && results[2]) {
        setVehicles(results[2].data);
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
      
      // Update local state instantly instead of fetching everything again from network
      const newBag = res.data;
      setBags(prev => [newBag, ...prev]);
      
      setStats(prev => {
        const newTotalBags = prev.total_bags + 1;
        const newTotalWeight = prev.total_weight + liveKg;
        const newTotalAmount = prev.total_amount + (liveKg * price);
        return {
          total_bags: newTotalBags,
          total_weight: +newTotalWeight.toFixed(2),
          avg_weight: +(newTotalWeight / newTotalBags).toFixed(2),
          total_amount: +newTotalAmount.toFixed(2),
        };
      });

      if (role === 'buyer' && selVehId) {
        setVehicles(prev => prev.map(v => {
          if (v.id === selVehId) {
            return {
              ...v,
              bags: (v.bags || 0) + 1,
              kg: +((v.kg || 0.0) + liveKg).toFixed(2)
            };
          }
          return v;
        }));
      }
    } catch (e) {
      setFlash(false);
      console.log('Error adding bag', e);
      Alert.alert('Error', 'Failed to save bag weight.');
    }
  };

  const handleDeleteBag = async (id) => {
    const bagToDelete = bags.find(b => b.id === id);
    if (!bagToDelete) return;

    try {
      // Optimistically update local states
      setBags(prev => prev.filter(b => b.id !== id));
      
      setStats(prev => {
        const newTotalBags = Math.max(0, prev.total_bags - 1);
        const newTotalWeight = Math.max(0.0, prev.total_weight - bagToDelete.weight);
        const newTotalAmount = Math.max(0.0, prev.total_amount - (bagToDelete.weight * (bagToDelete.price || 28.0)));
        return {
          total_bags: newTotalBags,
          total_weight: +newTotalWeight.toFixed(2),
          avg_weight: newTotalBags > 0 ? +(newTotalWeight / newTotalBags).toFixed(2) : 0.0,
          total_amount: +newTotalAmount.toFixed(2),
        };
      });

      if (role === 'buyer' && bagToDelete.veh_id) {
        setVehicles(prev => prev.map(v => {
          if (v.id === bagToDelete.veh_id) {
            return {
              ...v,
              bags: Math.max(0, (v.bags || 0) - 1),
              kg: Math.max(0.0, +((v.kg || 0.0) - bagToDelete.weight).toFixed(2))
            };
          }
          return v;
        }));
      }

      await client.delete(`/bags/${id}/`);
    } catch (e) {
      console.log('Error deleting bag', e);
      Alert.alert('Error', 'Failed to delete bag.');
      // Re-fetch to recover consistent state
      fetchData();
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
  const selectedFishBags = bags.filter(b => b.fish === fish).length;
  const selectedFishWeight = bags.filter(b => b.fish === fish).reduce((acc, b) => acc + b.weight, 0);
  const totalValue = bags.reduce((acc, b) => acc + b.weight * (b.price || 28.0), 0);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // Group active bags by fish type and calculate totals
  const fishSummary = FISH_KEYS.map((k, idx) => {
    const total = bags.filter(b => b.fish === k).reduce((acc, b) => acc + b.weight, 0);
    return {
      key: k,
      name: FISH_NAMES[idx],
      emoji: FISH_EMOJI[k],
      weight: total
    };
  }).filter(item => item.weight > 0);

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
                  style={[
                    styles.chip,
                    isSelected && {
                      borderColor: '#3b82f6',
                      backgroundColor: '#3b82f6',
                    }
                  ]}
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
                style={[
                  styles.chip,
                  isSelected && {
                    borderColor: role === 'farmer' ? GREEN : '#3b82f6',
                    backgroundColor: role === 'farmer' ? GREEN : '#3b82f6',
                  }
                ]}
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
            <Text style={styles.statLabel}>{t.totalBags}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: role === 'farmer' ? GREEN : '#3b82f6' }]}>{selectedFishBags}</Text>
            <Text style={styles.statLabel}>{FISH_NAMES[FISH_KEYS.indexOf(fish)]} {t.totalBags}</Text>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: role === 'farmer' ? GREEN : '#3b82f6' }]}>{selectedFishWeight.toFixed(1)} kg</Text>
            <Text style={styles.statLabel}>{FISH_NAMES[FISH_KEYS.indexOf(fish)]} {t.totalWeight}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: role === 'farmer' ? GREEN : '#3b82f6' }]}>{totalWeight.toFixed(1)} kg</Text>
            <Text style={styles.statLabel}>{t.totalWeight}</Text>
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
          {
            backgroundColor: role === 'farmer' ? GREEN : '#3b82f6',
            shadowColor: role === 'farmer' ? GREEN : '#3b82f6',
          },
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

      {/* Weight Summary by Fish Type Card */}
      {bags.length > 0 && fishSummary.length > 0 && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>WEIGHT BY FISH TYPE</Text>
          {fishSummary.map((item, idx) => (
            <View key={item.key}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryFishName}>
                  {item.emoji} {item.name}
                </Text>
                <Text style={styles.summaryFishWeight}>
                  {item.weight.toFixed(1)} kg
                </Text>
              </View>
              {idx < fishSummary.length - 1 && <View style={styles.summaryDivider} />}
            </View>
          ))}
        </View>
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
    backgroundColor: '#1e293b', // Slate control panel
    borderRadius: 24,
    padding: 22,
    marginBottom: 16,
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  glowDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  cardHeaderTxt: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardSub: {
    color: '#64748b',
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  weightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#020617', // Pitch black display screen
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginVertical: 8,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  pulsingWeight: {
    borderColor: '#10b981',
  },
  weightNum: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#10b981', // Neon green digital readout
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  weightUnit: {
    fontSize: 22,
    color: '#10b981',
    marginLeft: 8,
    fontWeight: 'bold',
    opacity: 0.8,
  },
  scaleFooter: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
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
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: '#ffffff',
    margin: 5,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
    fontWeight: '500',
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
    borderWidth: 1.5,
    borderColor: BORDER_COLOR,
    borderRadius: 16,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  scaleCardDisconnected: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  scaleCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  disconnectBtn: {
    backgroundColor: '#ef444420',
    borderWidth: 1,
    borderColor: '#ef444480',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  disconnectBtnTxt: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: 'bold',
  },
  disconnectedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  disconnectedTxt: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 16,
    fontWeight: '600',
  },
  connectBtn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  connectBtnTxt: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: TEXT_DARK,
  },
  statLabel: {
    fontSize: 11,
    color: TEXT_LIGHT,
    marginTop: 4,
    fontWeight: '500',
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
    height: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    elevation: 3,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
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
  summaryCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: BORDER_COLOR,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: TEXT_LIGHT,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  summaryFishName: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  summaryFishWeight: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2563eb', // bold blue text
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#f1f5f9', // subtle divider
  },
});
