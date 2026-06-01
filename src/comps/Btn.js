import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { GREEN } from '../constants';

export default function Btn({ title, onPress, disabled, loading, secondary, style, textStyle }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        secondary ? styles.secondaryBtn : styles.primaryBtn,
        disabled && styles.disabledBtn,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? GREEN : '#fff'} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            secondary ? styles.secondaryText : styles.primaryText,
            disabled && styles.disabledText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  primaryBtn: {
    backgroundColor: GREEN,
  },
  secondaryBtn: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: GREEN,
  },
  disabledBtn: {
    backgroundColor: '#cbd5e1',
    borderColor: '#cbd5e1',
    elevation: 0,
    shadowOpacity: 0,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
  primaryText: {
    color: '#fff',
  },
  secondaryText: {
    color: GREEN,
  },
  disabledText: {
    color: '#94a3b8',
  },
});
