import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import 'react-native-gesture-handler';

import Splash from './src/screens/Splash';
import Lang from './src/screens/Lang';
import Role from './src/screens/Role';
import Login from './src/screens/Login';
import Signup from './src/screens/Signup';
import Farmer from './src/screens/Farmer';
import Buyer from './src/screens/Buyer';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={Splash} />
        <Stack.Screen name="Lang" component={Lang} />
        <Stack.Screen name="Role" component={Role} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="Farmer" component={Farmer} />
        <Stack.Screen name="Buyer" component={Buyer} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
