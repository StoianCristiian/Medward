import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';

// Importăm implementările specifice și Use Case-ul (Injectare Manuală)
import HealthConnectAdapter from '../../infrastructure/health_connect/HealthConnectAdapter';
import BackendApiAdapter from '../../infrastructure/api/BackendApiAdapter';
import SyncHeartRateData from '../../use_cases/SyncHeartRateData';

const healthConnectAdapter = new HealthConnectAdapter();
const backendApiAdapter = new BackendApiAdapter();
const syncHeartRateDataUseCase = new SyncHeartRateData(healthConnectAdapter, backendApiAdapter);

export default function HomeScreen() {
    const [status, setStatus] = useState('Inițializare...');
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);

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
        
        // Executăm Use Case-ul de domeniu care se ocupă cu tot
        const result = await syncHeartRateDataUseCase.execute(addLog);
        
        if (result.success) {
            setStatus('✅ ' + result.message);
        } else {
            setStatus('❌ ' + result.message);
        }

        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>MedWard Mobile</Text>
            <Text style={styles.statusLabel}>Status sistem (Clean Arch):</Text>
            <Text style={styles.statusText}>{status}</Text>

            <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]} 
                onPress={handleSync}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Sincronizează datele acum</Text>
                )}
            </TouchableOpacity>

            <Text style={styles.logTitle}>Istoric acțiuni:</Text>
            <ScrollView style={styles.logContainer}>
                {logs.map((log, index) => (
                    <Text key={index} style={styles.logText}>{log}</Text>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fb',
        paddingTop: 60,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a202c',
        marginBottom: 20,
        textAlign: 'center',
    },
    statusLabel: {
        fontSize: 14,
        color: '#718096',
        marginTop: 10,
    },
    statusText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2d3748',
        marginBottom: 30,
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    button: {
        backgroundColor: '#3182ce',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 30,
        elevation: 2,
    },
    buttonDisabled: {
        backgroundColor: '#63b3ed',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    logTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4a5568',
        marginBottom: 10,
    },
    logContainer: {
        flex: 1,
        backgroundColor: '#1a202c',
        borderRadius: 8,
        padding: 15,
    },
    logText: {
        color: '#a0aec0',
        fontFamily: 'monospace',
        fontSize: 12,
        marginBottom: 6,
    },
});