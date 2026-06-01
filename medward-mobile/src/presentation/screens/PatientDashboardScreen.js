import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';

// Importăm implementările specifice și Use Case-ul
import HealthConnectAdapter from '../../infrastructure/health_connect/HealthConnectAdapter';
import BackendApiAdapter from '../../infrastructure/api/BackendApiAdapter';
import SyncHeartRateData from '../../use_cases/SyncHeartRateData';
import AsyncStorage from '@react-native-async-storage/async-storage';

const healthConnectAdapter = new HealthConnectAdapter();
const backendApiAdapter = new BackendApiAdapter();
const syncHeartRateDataUseCase = new SyncHeartRateData(healthConnectAdapter, backendApiAdapter);

export default function PatientDashboardScreen({ navigation }) {
    const [status, setStatus] = useState('Inițializare...');
    const [loading, setLoading] = useState(false);
    const [codeLoading, setCodeLoading] = useState(false);
    const [logs, setLogs] = useState([]);
    const [pairingCode, setPairingCode] = useState(null);

    useEffect(() => {
        async function initHealthConnect() {
            try {
                const isInitialized = await healthConnectAdapter.initialize();
                if (isInitialized) {
                    setStatus('Health Connect pregătit.');
                } else {
                    setStatus('Nu s-a putut inițializa Health Connect.');
                }
            } catch (error) {
                setStatus(`Eroare la inițializare: ${error.message}`);
            }
        }
        initHealthConnect();
    }, []);

    const addLog = (msg) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
    };

    const handleSync = async () => {
        setLoading(true);
        setLogs([]);
        
        const result = await syncHeartRateDataUseCase.execute(addLog);
        if (result.success) {
            setStatus('✅ ' + result.message);
        } else {
            setStatus('❌ ' + result.message);
        }
        setLoading(false);
    };

    const handleGenerateCode = async () => {
        setCodeLoading(true);
        try {
            const res = await backendApiAdapter.generatePairingCode();
            if (res.success) {
                setPairingCode(res.code);  // <--- Modificat de la res.pairingCode la res.code pentru a potrivi structura backendului
                Alert.alert('Cod generat', 'Oferă acest cod medicului/supraveghetorului tău.');
            }
        } catch (e) {
            Alert.alert('Eroare', 'Nu s-a putut genera codul.');
        }
        setCodeLoading(false);
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userRole');
        navigation.replace('Login');
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Panou Pacient</Text>
                <TouchableOpacity onPress={handleLogout}>
                    <Text style={styles.logoutText}>Deconectare</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Sincronizare Semne Vitale</Text>
                <Text style={styles.statusText}>{status}</Text>

                <TouchableOpacity 
                    style={[styles.button, loading && styles.buttonDisabled]} 
                    onPress={handleSync}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sincronizează Datele</Text>}
                </TouchableOpacity>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Asociere Supraveghetor</Text>
                <Text style={styles.desc}>Permite cuiva să îți vadă datele medicale generând un cod unic (valabil 10 minute).</Text>
                
                {pairingCode ? (
                    <View style={styles.codeContainer}>
                        <Text style={styles.codeText}>{pairingCode}</Text>
                    </View>
                ) : null}

                <TouchableOpacity 
                    style={[styles.button, styles.codeButton, codeLoading && styles.buttonDisabled]} 
                    onPress={handleGenerateCode}
                    disabled={codeLoading}
                >
                    {codeLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Generează Cod</Text>}
                </TouchableOpacity>
            </View>

            <Text style={styles.logTitle}>Istoric Sincronizare:</Text>
            <View style={styles.logContainer}>
                {logs.length === 0 ? <Text style={styles.noLogs}>Niciun istoric recent.</Text> : logs.map((log, index) => (
                    <Text key={index} style={styles.logText}>{log}</Text>
                ))}
            </View>

            <TouchableOpacity style={styles.switchRoleButton} onPress={() => navigation.replace('RoleSelection')}>
                <Text style={styles.switchRoleText}>Ești Medic? Schimbă Rolul</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f7f6' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#3182ce' },
    title: { fontSize: 24, fontWeight: 'bold', color: 'white' },
    logoutText: { color: 'white', textDecorationLine: 'underline' },
    card: { backgroundColor: 'white', margin: 15, padding: 20, borderRadius: 12, shadowColor: '#000', shadowOffset: { width:0, height:2 }, shadowOpacity: 0.1, elevation: 3 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#2d3748' },
    statusText: { color: '#718096', marginBottom: 15 },
    desc: { color: '#718096', marginBottom: 15, fontSize: 14 },
    codeContainer: { backgroundColor: '#edf2f7', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
    codeText: { fontSize: 32, fontWeight: 'bold', letterSpacing: 5, color: '#2b6cb0' },
    button: { backgroundColor: '#3182ce', padding: 15, borderRadius: 8, alignItems: 'center' },
    buttonDisabled: { opacity: 0.7 },
    codeButton: { backgroundColor: '#48bb78' },
    buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    logTitle: { marginLeft: 20, fontSize: 16, fontWeight: 'bold', color: '#2d3748', marginTop: 10 },
    logContainer: { backgroundColor: 'white', margin: 15, padding: 15, borderRadius: 8, minHeight: 100 },
    logText: { fontSize: 13, color: '#4a5568', marginBottom: 4 },
    noLogs: { color: '#a0aec0', fontStyle: 'italic' },
    switchRoleButton: { marginTop: 20, padding: 20, alignItems: 'center', marginBottom: 40 },
    switchRoleText: { color: '#718096', textDecorationLine: 'underline' }
});