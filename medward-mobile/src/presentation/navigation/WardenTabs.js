import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import WardenMonitorScreen from '../screens/WardenMonitorScreen';
import WardenHistoryScreen from '../screens/WardenHistoryScreen';
import WardenTreatmentScreen from '../screens/WardenTreatmentScreen';
import WardenProfileScreen from '../screens/WardenProfileScreen';

const Tab = createBottomTabNavigator();

export default function WardenTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Monitorizare') iconName = focused ? 'pulse' : 'pulse-outline';
          else if (route.name === 'Istoric') iconName = focused ? 'time' : 'time-outline';
          else if (route.name === 'Tratament') iconName = focused ? 'medkit' : 'medkit-outline';
          else if (route.name === 'Profil') iconName = focused ? 'person' : 'person-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#48bb78',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Monitorizare" component={WardenMonitorScreen} />
      <Tab.Screen name="Istoric" component={WardenHistoryScreen} />
      <Tab.Screen name="Tratament" component={WardenTreatmentScreen} />
      <Tab.Screen name="Profil" component={WardenProfileScreen} />
    </Tab.Navigator>
  );
}