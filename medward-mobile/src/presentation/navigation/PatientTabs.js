import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import PatientHomeScreen from '../screens/PatientHomeScreen';
import PatientConnectionsScreen from '../screens/PatientConnectionsScreen';
import PatientProfileScreen from '../screens/PatientProfileScreen';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export default function PatientTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Acasă') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Conexiuni') {
            iconName = focused ? 'link' : 'link-outline';
          } else if (route.name === 'Profil') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3182ce',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Acasă" component={PatientHomeScreen} />
      <Tab.Screen name="Conexiuni" component={PatientConnectionsScreen} />
      <Tab.Screen name="Profil" component={PatientProfileScreen} />
    </Tab.Navigator>
  );
}