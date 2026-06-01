import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { FISH_KEYS, FISH_NAMES, FISH_EMOJI, GREEN, GREEN_LIGHT, BORDER_COLOR, TEXT_DARK, TEXT_LIGHT } from '../constants';
import Btn from '../comps/Btn';

export default function Calc() {
  const [items, setItems] = useState([{ type: 'rohu', gross: '', price: '' }]);

  const addItem = () => setItems(p => [...p, { type: 'catla', gross: '', price: '' }]);
  const updItem = (index, key, val) => {
    setItems(p => p.map((f, j) => (j === index ? { ...f, [key]: val } : f)));
  };
  const remItem = (index) => setItems(p => p.filter((_, j) => j !== index));

  const getCalculation = (item) => {
    const gross = parseFloat(item.gross) || 0;
    const price = parseFloat(item.price) || 0;
    // Standard AP weighbridge deduction: 5kg per 100kg
    const deduction = Math.floor(gross / 100) * 5;
    const net = gross - deduction;
    return { gross, deduction, net, total: net * price };
  };

  const grandTotal = items.reduce((sum, item) => sum + getCalculation(item).total, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🧮 Deduction Calculator</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>5 kg / 100 kg deducted</Text>
        </View>
      </View>

      {items.map((item, index) => {
        const res = getCalculation(item);
        return (
          <View key={index} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Fish {index + 1}</Text>
              {index > 0 && (
                <TouchableOpacity onPress={() => remItem(index)} style={styles.removeBtn}>
                  <Text style={styles.removeText}>Remove ×</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Fish selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {FISH_KEYS.slice(0, 5).map((k, idx) => {
                const isSelected = item.type === k;
                return (
                  <TouchableOpacity
                    key={k}
                    style={[styles.chip, isSelected && styles.activeChip]}
                    onPress={() => updItem(index, 'type', k)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.activeChipText]}>
                      {FISH_EMOJI[k]} {FISH_NAMES[idx]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TextInput
              style={styles.input}
              placeholder="Total Gross Weight (kg)"
              keyboardType="numeric"
              value={item.gross}
              onChangeText={val => updItem(index, 'gross', val)}
            />

            {item.gross ? (
              <View style={styles.breakdown}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>📦 Gross</Text>
                  <Text style={styles.breakdownVal}>{res.gross} kg</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: '#ef4444' }]}>➖ Deduction</Text>
                  <Text style={[styles.breakdownVal, { color: '#ef4444' }]}>− {res.deduction} kg</Text>
                </View>
                <View style={[styles.breakdownRow, styles.netRow]}>
                  <Text style={[styles.breakdownLabel, { color: GREEN }]}>✅ Net Weight</Text>
                  <Text style={[styles.breakdownVal, { color: GREEN, fontWeight: 'bold' }]}>{res.net} kg</Text>
                </View>
              </View>
            ) : null}

            <TextInput
              style={styles.input}
              placeholder="Price per kg (₹)"
              keyboardType="numeric"
              value={item.price}
              onChangeText={val => updItem(index, 'price', val)}
            />

            {item.gross && item.price ? (
              <View style={styles.resultStrip}>
                <Text style={styles.resultLabel}>💰 Net Total</Text>
                <Text style={styles.resultVal}>₹{Math.round(res.total).toLocaleString('en-IN')}</Text>
              </View>
            ) : null}
          </View>
        );
      })}

      <TouchableOpacity style={styles.addBtn} onPress={addItem}>
        <Text style={styles.addBtnTxt}>+ Add Another Fish</Text>
      </TouchableOpacity>

      {items.length > 1 && grandTotal > 0 ? (
        <View style={styles.grandCard}>
          <Text style={styles.grandTitle}>GRAND SUMMARY</Text>
          {items.map((item, idx) => {
            const res = getCalculation(item);
            if (res.net <= 0) return null;
            return (
              <View key={idx} style={styles.grandRow}>
                <Text style={styles.grandRowLabel}>
                  {FISH_EMOJI[item.type]} {FISH_NAMES[FISH_KEYS.indexOf(item.type)]} ({res.net} kg)
                </Text>
                <Text style={styles.grandRowVal}>₹{Math.round(res.total).toLocaleString('en-IN')}</Text>
              </View>
            );
          })}
          <View style={styles.grandDivider} />
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total Pay</Text>
            <Text style={styles.grandTotalVal}>₹{Math.round(grandTotal).toLocaleString('en-IN')}</Text>
          </View>
        </View>
      ) : null}
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
  badge: {
    backgroundColor: GREEN_LIGHT,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: GREEN,
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: TEXT_DARK,
  },
  removeBtn: {
    backgroundColor: '#fef2f2',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  removeText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: 'bold',
  },
  chipsScroll: {
    marginBottom: 12,
  },
  chip: {
    borderWidth: 1.5,
    borderColor: BORDER_COLOR,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 6,
    backgroundColor: '#ffffff',
  },
  activeChip: {
    borderColor: GREEN,
    backgroundColor: GREEN_LIGHT,
  },
  chipText: {
    fontSize: 12,
    color: TEXT_LIGHT,
  },
  activeChipText: {
    color: GREEN,
    fontWeight: 'bold',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 10,
    backgroundColor: '#f8fafc',
  },
  breakdown: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    padding: 10,
    marginBottom: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  breakdownLabel: {
    fontSize: 12,
    color: TEXT_LIGHT,
  },
  breakdownVal: {
    fontSize: 12,
    color: TEXT_DARK,
    fontWeight: '600',
  },
  netRow: {
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
    paddingTop: 4,
    marginTop: 4,
  },
  resultStrip: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 13,
    color: '#92400e',
    fontWeight: 'bold',
  },
  resultVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#b45309',
  },
  addBtn: {
    height: 46,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: GREEN,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginBottom: 16,
  },
  addBtnTxt: {
    color: GREEN,
    fontSize: 14,
    fontWeight: 'bold',
  },
  grandCard: {
    backgroundColor: GREEN,
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  grandTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
    opacity: 0.8,
    letterSpacing: 1,
    marginBottom: 10,
  },
  grandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  grandRowLabel: {
    color: '#ffffff',
    fontSize: 13,
  },
  grandRowVal: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  grandDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 8,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalLabel: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  grandTotalVal: {
    color: '#34d399',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
