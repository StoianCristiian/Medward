import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View, Platform, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import Constants from 'expo-constants';
import axios from 'axios';

import LoginScreen from './src/presentation/screens/LoginScreen';
import RoleSelectionScreen from './src/presentation/screens/RoleSelectionScreen';
import PatientTabs from './src/presentation/navigation/PatientTabs';
import WardenTabs from './src/presentation/navigation/WardenTabs';

import HealthConnectAdapter from './src/infrastructure/health_connect/HealthConnectAdapter';
import BackendApiAdapter from './src/infrastructure/api/BackendApiAdapter';
import SyncVitalsData from './src/use_cases/SyncVitalsData';

const BACKGROUND_SYNC_TASK = 'BACKGROUND_SYNC_TASK';

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    console.log('[Background] Sincronizare Vitals activată din fundal');
    
    // Verificăm dacă suntem pacient înainte de a trimite
    const role = await AsyncStorage.getItem('userRole');
    if (role !== 'patient') {
        return BackgroundTask.BackgroundTaskResult ? BackgroundTask.BackgroundTaskResult.Success : 1;
    }

    const healthConnectAdapter = new HealthConnectAdapter();
    const backendApiAdapter = new BackendApiAdapter();
    const syncVitalsDataUseCase = new SyncVitalsData(healthConnectAdapter, backendApiAdapter);

    await healthConnectAdapter.initialize();
    const result = await syncVitalsDataUseCase.execute((msg) => console.log('[Background Log]', msg), true);
    return result.success ? BackgroundTask.BackgroundTaskResult.Success : BackgroundTask.BackgroundTaskResult.Failed;
  } catch (error) {
    console.error('[Background Error]', error);
    return BackgroundTask.BackgroundTaskResult ? BackgroundTask.BackgroundTaskResult.Failed : 2;
  }
});

const Stack = createNativeStackNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'implicit',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
  
  if (!projectId) {
      console.warn("Nu s-a putut găsi projectId în configurația expo. Asigură-te că app.json e corect.");
      return null;
  }

  token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  return token;
}

async function registerBackgroundTaskAsync() {
  try {
    return BackgroundTask.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false, // android only
      startOnBoot: true, // android only
    });
  } catch (err) {
    console.log("Eroare inregistrare Background Task:", err);
  }
}

function DispatcherScreen({ navigation }) {
  useEffect(() => {
    const checkRoleAndPush = async () => {
      const userToken = await AsyncStorage.getItem('userToken');
      // Setam tokenul de push notification daca exista si il trimitem la logare spre backend
      if (userToken) {
        try {
          const pushToken = await registerForPushNotificationsAsync();
          if (pushToken) {
             const backendApiAdapter = new BackendApiAdapter();
             await backendApiAdapter.updatePushToken(pushToken);
             console.log("Push Token înregistrat cu succes pe server!");
          }
        } catch (e) {
          console.log("Nu am putut asambla/trimite Push Token:", e.message);
          // Eroare 401 de la Axios
          if (e.response && e.response.status === 401) {
             console.log("Token expirat/invalid. Se forțează relogarea...");
             await AsyncStorage.clear();
             navigation.replace('Login');
             return;
          }
        }
      }

      const role = await AsyncStorage.getItem('userRole');
      if (!role) {
        navigation.replace('RoleSelection');
      } else if (role === 'patient') {
        registerBackgroundTaskAsync();
        navigation.replace('PatientDashboard');
      } else if (role === 'warden') {
        navigation.replace('WardenDashboard');
      }
    };
    checkRoleAndPush();
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