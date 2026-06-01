let auth;
try {
  // Use dynamic require so standard Expo Go does not crash when bundling
  auth = require('@react-native-firebase/auth').default;
} catch (e) {
  console.log("Firebase Native SDK not available. Falling back to Simulated Authentication.");
  auth = null;
}

export { auth };
export default auth;
