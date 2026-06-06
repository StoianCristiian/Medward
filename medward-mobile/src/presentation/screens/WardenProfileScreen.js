import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import BackendApiAdapter from '../../infrastructure/api/BackendApiAdapter';

const backendApiAdapter = new BackendApiAdapter();

export default function WardenProfileScreen({ navigation }) {
    const [pairingCode, setPairingCode] = useState('');
    const [linking, setLinking] = useState(false);

    const handleLinkPatient = async () => {
        if (!pairingCode || pairingCode.length !== 6) {
            Alert.alert("Eroare", "Te rugăm să introduci un cod valid (6 cifre).");
            return;
        }

        setLinking(true);
        try {
            const res = await backendApiAdapter.linkPatient(pairingCode);
            if (res.success) {
                Alert.alert("Succes", "Pacientul a fost adăugat cu succes! Revino în ecranul de monitorizare.");
                setPairingCode('');
            } else {
                Alert.alert("Eroare", res.message || "Cod invalid sau expirat.");
            }
        } catch (error) {
            Alert.alert("Eroare", "A apărut o problemă la conexiune.");
        }
        setLinking(false);
    };

    const handleLogout = async () => {
        Alert.alert("Deconectare", "Ești sigur că vrei să ieși?", [
            { text: "Nu", style: "cancel" },
            { 
                text: "Da", style: 'destructive',
                onPress: async () => {
                    await AsyncStorage.multiRemove(['userToken', 'userRole']);
                    navigation.replace('Login');
                }
            }
        ]);
    };

    const handleSwitchRole = () => {
        navigation.replace('RoleSelection');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Profil Medic / Aparținător</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Asociază un Nou Pacient</Text>
                <Text style={styles.desc}>Introdu codul de 6 cifre primit de la pacient pentru a fi autorizat să-i accesezi dosarul și datele telemetrice.</Text>
                
                <View style={styles.inputRow}>
                    <TextInput 
                        style={styles.input} 
                        placeholder="Ex: 574218"
                        keyboardType="numeric"
                        maxLength={6}
                        value={pairingCode}
                        onChangeText={setPairingCode}
                    />
                    <TouchableOpacity 
                        style={[styles.button, linking && { opacity: 0.7 }]} 
                        onPress={handleLinkPatient}
                        disabled={linking}
                    >
                        {linking ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Adaugă</Text>}
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.card}>
                <View style={styles.profileHeader}>
                    <View style={styles.avatar}>
                        <Ionicons name="medical" size={30} color="#48bb78" />
                    </View>
                    <View>
                        <Text style={styles.name}>Cont Supervizor</Text>
                        <Text style={styles.email}>Acreditat pentru monitorizare</Text>
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
                    <Text style={styles.menuText}>Schimbă Rol în Pacient</Text>
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
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#2d3748', marginBottom: 5 },
    desc: { color: '#718096', fontSize: 14, marginBottom: 15 },
    inputRow: { flexDirection: 'row', alignItems: 'center' },
    input: { flex: 1, backgroundColor: '#edf2f7', padding: 15, borderRadius: 12, fontSize: 18, letterSpacing: 2, marginRight: 10, color: '#2d3748', fontWeight: 'bold' },
    button: { backgroundColor: '#48bb78', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    profileHeader: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#edf2f7', paddingBottom: 20, marginBottom: 10 },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#f0fff4', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    name: { fontSize: 18, fontWeight: 'bold', color: '#2d3748' },
    email: { fontSize: 13, color: '#718096', marginTop: 2 },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    menuText: { fontSize: 16, color: '#4a5568', marginLeft: 15, fontWeight: '500' },
    menuTextLogout: { fontSize: 16, color: '#e53e3e', marginLeft: 15, fontWeight: 'bold' },
    sectionTitle: { fontSize: 13, textTransform: 'uppercase', color: '#a0aec0', fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 }
});