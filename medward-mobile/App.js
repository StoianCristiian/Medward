import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';

import LoginScreen from './src/presentation/screens/LoginScreen';
import RoleSelectionScreen from './src/presentation/screens/RoleSelectionScreen';
import PatientTabs from './src/presentation/navigation/PatientTabs';
import WardenTabs from './src/presentation/navigation/WardenTabs';

const Stack = createNativeStackNavigator();

function DispatcherScreen({ navigation }) {
  useEffect(() => {
    const checkRole = async () => {
      const role = await AsyncStorage.getItem('userRole');
      if (!role) {
        navigation.replace('RoleSelection');
      } else if (role === 'patient') {
        navigation.replace('PatientDashboard');
      } else if (role === 'warden') {
        navigation.replace('WardenDashboard');
      }
    };
    checkRole();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a202c' }}>
      <ActivityIndicator size="large" color="#3182ce" />
    </View>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    // Verificăm dacă utilizatorul are deja o sesiune activă
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        setUserToken(token);
      } catch (e) {
        console.error('Eroare la citirea tokenului', e);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a202c' }}>
        <ActivityIndicator size="large" color="#3182ce" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ headerShown: false }}
        initialRouteName={userToken == null ? 'Login' : 'Home'}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={DispatcherScreen} />
        <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
        <Stack.Screen name="PatientDashboard" component={PatientTabs} />
        <Stack.Screen name="WardenDashboard" component={WardenTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}