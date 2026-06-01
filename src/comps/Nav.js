import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GREEN, GREEN_LIGHT, BORDER_COLOR, TEXT_DARK, TEXT_LIGHT } from '../constants';

export default function Nav({ tabs, icons, labels, activeTab, onTabSelect }) {
  return (
    <View style={styles.navBar}>
      {tabs.map((tab, idx) => {
        const isActive = activeTab === tab;
        return (
          <TouchableOpacity
            key={tab}
            onPress={() => onTabSelect(tab)}
            style={styles.navItem}
            activeOpacity={0.8}
          >
            <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
              <Text style={[styles.iconText, isActive && styles.activeIconText]}>
                {icons[idx]}
              </Text>
            </View>
            <Text style={[styles.label, isActive ? styles.activeLabel : styles.inactiveLabel]}>
              {labels[idx]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    height: 65,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 5,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconContainer: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  activeIconContainer: {
    backgroundColor: GREEN_LIGHT,
  },
  iconText: {
    fontSize: 20,
    color: TEXT_LIGHT,
  },
  activeIconText: {
    color: GREEN,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  activeLabel: {
    color: GREEN,
  },
  inactiveLabel: {
    color: TEXT_LIGHT,
  },
});
