import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import BackendApiAdapter from '../../infrastructure/api/BackendApiAdapter';
import AsyncStorage from '@react-native-async-storage/async-storage';

const backendApiAdapter = new BackendApiAdapter();

export default function WardenDashboardScreen({ navigation }) {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pairingCode, setPairingCode] = useState('');
    const [linking, setLinking] = useState(false);

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const data = await backendApiAdapter.getMonitoredPatients();
            if (data.success) {
                setPatients(data.patients);
            }
        } catch (error) {
            console.log("Eroare fetch patients", error);
        }
        setLoading(false);
    };

    const handleLinkPatient = async () => {
        if (!pairingCode || pairingCode.length !== 6) {
            Alert.alert("Eroare", "Te rugăm să introduci un cod valid (6 cifre).");
            return;
        }

        setLinking(true);
        try {
            const res = await backendApiAdapter.linkPatient(pairingCode);
            if (res.success) {
                Alert.alert("Succes", "Pacientul a fost adăugat cu succes!");
                setPairingCode('');
                fetchPatients(); // Refetch patients
            } else {
                Alert.alert("Eroare", res.message || "Cod invalid sau expirat.");
            }
        } catch (error) {
            Alert.alert("Eroare", "A apărut o problemă la conexiune.");
        }
        setLinking(false);
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userRole');
        navigation.replace('Login');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Panou Medic / Supraveghetor</Text>
                <TouchableOpacity onPress={handleLogout}>
                    <Text style={styles.logoutText}>Deconectare</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Conectează un Pacient Nou</Text>
                <Text style={styles.desc}>Introdu codul de 6 cifre primit de la pacient pentru a fi autorizat să-i vezi datele.</Text>
                
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
                        style={[styles.button, linking && styles.buttonDisabled]} 
                        onPress={handleLinkPatient}
                        disabled={linking}
                    >
                        {linking ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Adaugă</Text>}
                    </TouchableOpacity>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Pacienții Tăi ({patients.length})</Text>
            
            {loading ? (
                <ActivityIndicator size="large" color="#3182ce" style={{marginTop: 20}} />
            ) : (
                <ScrollView style={styles.listContainer}>
                    {patients.length === 0 ? (
                        <Text style={styles.noPatients}>Nu monitorizezi încă niciun pacient.</Text>
                    ) : (
                        patients.map(p => (
                            <TouchableOpacity key={p._id} style={styles.patientCard} onPress={() => {
                                // De implementat mai tarziu
                                Alert.alert("Vizualizare", `Aici vor fi datele lui ${p.name}`);
                            }}>
                                <View>
                                    <Text style={styles.patientName}>{p.name}</Text>
                                    <Text style={styles.patientEmail}>{p.email}</Text>
                                </View>
                                <Text style={styles.viewText}>Vezi Date &rarr;</Text>
                            </TouchableOpacity>
                        ))
                    )}

                    <TouchableOpacity style={styles.switchRoleButton} onPress={() => navigation.replace('RoleSelection')}>
                        <Text style={styles.switchRoleText}>Ești Pacient? Schimbă Rolul</Text>
                    </TouchableOpacity>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f7f6' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#48bb78' },
    title: { fontSize: 18, fontWeight: 'bold', color: 'white' },
    logoutText: { color: 'white', textDecorationLine: 'underline' },
    card: { backgroundColor: 'white', margin: 15, padding: 20, borderRadius: 12, shadowColor: '#000', shadowOffset: { width:0, height:2 }, shadowOpacity: 0.1, elevation: 3 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#2d3748' },
    desc: { color: '#718096', marginBottom: 15, fontSize: 14 },
    inputRow: { flexDirection: 'row', alignItems: 'center' },
    input: { flex: 1, backgroundColor: '#edf2f7', padding: 15, borderRadius: 8, fontSize: 18, letterSpacing: 2, marginRight: 10 },
    button: { backgroundColor: '#48bb78', padding: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    sectionTitle: { marginLeft: 20, fontSize: 18, fontWeight: 'bold', color: '#2d3748', marginTop: 10, marginBottom: 5 },
    listContainer: { paddingHorizontal: 15 },
    noPatients: { textAlign: 'center', color: '#a0aec0', marginTop: 30, fontStyle: 'italic' },
    patientCard: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width:0, height:1 }, shadowOpacity: 0.05, elevation: 2 },
    patientName: { fontSize: 16, fontWeight: 'bold', color: '#2b6cb0' },
    patientEmail: { fontSize: 12, color: '#718096', marginTop: 2 },
    viewText: { color: '#48bb78', fontWeight: 'bold' },
    switchRoleButton: { marginTop: 30, padding: 20, alignItems: 'center', marginBottom: 40 },
    switchRoleText: { color: '#718096', textDecorationLine: 'underline' }
});