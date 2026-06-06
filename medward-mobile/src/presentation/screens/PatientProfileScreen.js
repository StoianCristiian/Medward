import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function PatientProfileScreen({ navigation }) {
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            const name = await AsyncStorage.getItem('userName');
            const email = await AsyncStorage.getItem('userEmail');
            if (name) setUserName(name);
            if (email) setUserEmail(email);
        };
        fetchUserData();
    }, []);

    const handleLogout = async () => {
        Alert.alert(
            "Deconectare",
            "Ești sigur că vrei să ieși din cont?",
            [
                { text: "Nu", style: "cancel" },
                { 
                    text: "Da", 
                    style: 'destructive',
                    onPress: async () => {
                        await AsyncStorage.multiRemove(['userToken', 'userRole']);
                        navigation.replace('Login');
                    }
                }
            ]
        );
    };

    const handleSwitchRole = () => {
        navigation.replace('RoleSelection');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Profilul Meu</Text>
            </View>

            <View style={styles.card}>
                <View style={styles.profileHeader}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={40} color="#a0aec0" />
                    </View>
                    <View>
                        <Text style={styles.name}>{userName || 'Pacient'}</Text>
                        <Text style={styles.email}>{userEmail ? `Cont: ${userEmail}` : 'Abonament Activ (Pacient)'}</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={24} color="#e53e3e" />
                    <Text style={styles.menuTextLogout}>Deconectare de la cont</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Setări Dezvoltator</Text>
                <TouchableOpacity style={styles.menuItem} onPress={handleSwitchRole}>
                    <Ionicons name="swap-horizontal" size={24} color="#718096" />
                    <Text style={styles.menuText}>Schimbă Rol în Medic (Warden)</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f7f6', paddingHorizontal: 15 },
    header: { paddingTop: 60, paddingBottom: 20 },
    title: { color: '#2d3748', fontSize: 26, fontWeight: 'bold' },
    
    card: { backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width:0, height:2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    
    profileHeader: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#edf2f7', paddingBottom: 20, marginBottom: 10 },
    avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#edf2f7', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    name: { fontSize: 18, fontWeight: 'bold', color: '#2d3748' },
    email: { fontSize: 14, color: '#718096', marginTop: 2 },

    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
    menuText: { fontSize: 16, color: '#4a5568', marginLeft: 15, fontWeight: '500' },
    menuTextLogout: { fontSize: 16, color: '#e53e3e', marginLeft: 15, fontWeight: 'bold' },
    
    sectionTitle: { fontSize: 14, textTransform: 'uppercase', color: '#a0aec0', fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 }
});