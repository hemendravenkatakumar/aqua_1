import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { GREEN, GREEN_LIGHT, BORDER_COLOR, TEXT_DARK, TEXT_LIGHT } from '../constants';
import client from '../api/client';

export default function History() {
  const [batches, setBatches] = useState([]);
  const [summary, setSummary] = useState({
    total_kg: 0.0,
    total_amt: 0.0,
    total_bags: 0,
    chart_data: [],
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const resList = await client.get('/batches/');
      setBatches(resList.data);

      const resSum = await client.get('/batches/weekly/');
      setSummary(resSum.data);
    } catch (e) {
      console.log('Error fetching history', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  // Find max value in chart data to scale heights
  const chartData = summary.chart_data || [];
  const maxKg = chartData.length > 0 ? Math.max(...chartData.map(d => d.kg)) : 1;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[GREEN]} />
      }
    >
      <Text style={styles.sectionTitle}>📅 WEEKLY SUMMARY</Text>
      
      {/* Summary grid */}
      <View style={styles.grid}>
        <View style={styles.gridBox}>
          <Text style={styles.gridVal}>{summary.total_bags}</Text>
          <Text style={styles.gridLabel}>Bags Weighed</Text>
        </View>
        <View style={styles.gridBox}>
          <Text style={[styles.gridVal, { color: GREEN }]}>{summary.total_kg} kg</Text>
          <Text style={styles.gridLabel}>Total Weight</Text>
        </View>
        <View style={[styles.gridBox, { width: '98%' }]}>
          <Text style={[styles.gridVal, { color: '#b45309', fontSize: 20 }]}>
            ₹{Math.round(summary.total_amt).toLocaleString('en-IN')}
          </Text>
          <Text style={styles.gridLabel}>Total Session Value</Text>
        </View>
      </View>

      {/* Custom Bar Chart */}
      {chartData.length > 0 ? (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Daily Weight (kg)</Text>
          <View style={styles.chartArea}>
            {chartData.map((d, index) => {
              const heightPct = Math.max(5, Math.round((d.kg / maxKg) * 100));
              return (
                <View key={index} style={styles.chartColumn}>
                  <View style={styles.barWrapper}>
                    <Text style={styles.barLabel}>{d.kg > 0 ? `${Math.round(d.kg)}` : ''}</Text>
                    <View style={[styles.bar, { height: `${heightPct}%` }]} />
                  </View>
                  <Text style={styles.dayLabel}>{d.day}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>📋 PAST BATCH SESSIONS</Text>

      {loading && batches.length === 0 ? (
        <ActivityIndicator size="large" color={GREEN} style={{ marginTop: 20 }} />
      ) : batches.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No saved batch sessions found.</Text>
          <Text style={styles.emptySubText}>Save weights in the Weight tab first.</Text>
        </View>
      ) : (
        batches.map((b) => (
          <View key={b.id} style={styles.batchCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.batchName}>{b.name}</Text>
              <Text style={styles.batchDate}>
                {new Date(b.created).toLocaleDateString([], { day: 'numeric', month: 'short' })}
              </Text>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fish Type</Text>
                <Text style={styles.detailVal}>🐟 {b.fish.toUpperCase()}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Quantity</Text>
                <Text style={styles.detailVal}>{b.bags} Bags</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Weight</Text>
                <Text style={[styles.detailVal, { color: GREEN, fontWeight: 'bold' }]}>{b.kg} kg</Text>
              </View>
              <View style={[styles.detailRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <Text style={styles.detailLabel}>Est. Amount</Text>
                <Text style={[styles.detailVal, { color: '#b45309', fontWeight: 'bold' }]}>
                  ₹{Math.round(b.amt).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          </View>
        ))
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
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: TEXT_LIGHT,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 16,
  },
  gridBox: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    padding: 12,
    margin: '1%',
    elevation: 1,
  },
  gridVal: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  gridLabel: {
    fontSize: 10,
    color: TEXT_LIGHT,
    marginTop: 2,
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: TEXT_DARK,
    marginBottom: 12,
  },
  chartArea: {
    height: 150,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingBottom: 5,
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barWrapper: {
    alignItems: 'center',
    width: '60%',
    height: '80%',
    justifyContent: 'flex-end',
  },
  barLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 4,
  },
  bar: {
    width: '100%',
    backgroundColor: GREEN,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  dayLabel: {
    fontSize: 10,
    color: TEXT_LIGHT,
    marginTop: 6,
    fontWeight: 'bold',
  },
  emptyBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  emptySubText: {
    fontSize: 12,
    color: TEXT_LIGHT,
    marginTop: 4,
  },
  batchCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  batchName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: TEXT_DARK,
  },
  batchDate: {
    fontSize: 11,
    color: TEXT_LIGHT,
  },
  cardBody: {
    padding: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: 12,
    color: TEXT_LIGHT,
  },
  detailVal: {
    fontSize: 13,
    color: TEXT_DARK,
    fontWeight: '500',
  },
});
