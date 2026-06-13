import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Animated, Linking, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HealthConnectAdapter from '../../infrastructure/health_connect/HealthConnectAdapter';
import BackendApiAdapter from '../../infrastructure/api/BackendApiAdapter';
import SyncVitalsData from '../../use_cases/SyncVitalsData';

const healthConnectAdapter = new HealthConnectAdapter();
const backendApiAdapter = new BackendApiAdapter();
const syncVitalsDataUseCase = new SyncVitalsData(healthConnectAdapter, backendApiAdapter);

export default function PatientHomeScreen() {
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [lastSync, setLastSync] = useState(null);
    const [counter, setCounter] = useState(0); // State pt fortarea UI update-ului la fiecare secundă
    const [userName, setUserName] = useState('');
    const [tasks, setTasks] = useState([]);
    const [userId, setUserId] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    
    // Animație blândă pentru inima de sincronizare
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const monitoringInterval = useRef(null);

    useEffect(() => {
        // Pornim tăcut HC 
        healthConnectAdapter.initialize().catch(e => console.log(e));

        // Citim numele utilizatorului din AsyncStorage
        const fetchUserData = async () => {
            const name = await AsyncStorage.getItem('userName');
            const storedUserId = await AsyncStorage.getItem('userId');
            if (name) {
                // Afișăm doar prenumele (primul cuvânt)
                setUserName(name.split(' ')[0]);
            }
            if (storedUserId) {
                setUserId(storedUserId);
                loadTreatments(storedUserId);
            }
        };
        fetchUserData();

        // Ticker pt secunde
        const timer = setInterval(() => {
             setCounter(c => c + 1);
        }, 1000);

        return () => {
            if (monitoringInterval.current) clearInterval(monitoringInterval.current);
            clearInterval(timer);
        };
    }, []);

    useEffect(() => {
        if (isMonitoring) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
                ])
            ).start();
        } else {
            Animated.timing(pulseAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        }
    }, [isMonitoring]);

    const loadTreatments = async (id) => {
        try {
            const result = await backendApiAdapter.getTreatments(id);
            if (result.success && result.treatments) {
                // Map the treatments according to what the UI expects (id, name, time, done)
                const mappedTasks = result.treatments.map(t => ({
                    id: t._id,
                    name: t.medicationName,
                    time: t.frequency, // momentan afișăm frecvența în loc de oră dacă e hardcodată
                    done: false, // temporar, neimplementat complet statusul pe backend pe zi curentă
                }));
                setTasks(mappedTasks);
            }
        } catch (error) {
            console.error("Eroare incarcare tratamente:", error);
        }
    };

    const handleSync = async () => {
        // Pasiv, nu afișăm logs pe UI decât data ultimei sincronizări
        const result = await syncVitalsDataUseCase.execute((msg) => console.log('Sync log:', msg));
        if (result.success) {
            setLastSync(new Date());
        }
    };

    const toggleMonitoring = () => {
        if (isMonitoring) {
            setIsMonitoring(false);
            if (monitoringInterval.current) clearInterval(monitoringInterval.current);
        } else {
            setIsMonitoring(true);
            handleSync();
            monitoringInterval.current = setInterval(() => {
                handleSync();
            }, 60000); // 1 minut
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        if (userId) {
            await loadTreatments(userId);
        }
        await handleSync();
        setRefreshing(false);
    };

    const confirmTask = (id) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, done: true } : t));
    };

    const handleSos = () => {
        Alert.alert(
            "Alarmă SOS", 
            "Ești pe cale să suni contactul de urgență / medicul.",
            [
                { text: "Anulează", style: "cancel" },
                { text: "Sună Acum", onPress: () => Linking.openURL('tel:112') }
            ]
        );
    };

    const todayString = new Date().toLocaleDateString('ro-RO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <ScrollView 
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#48bb78"]} />
            }
        >
            <View style={styles.header}>
                <Text style={styles.date}>{todayString}</Text>
                <Text style={styles.title}>Salut, {userName || 'Utilizator'}!</Text>
            </View>

            {/* Status Sincronizare */}
            <View style={styles.card}>
                <View style={styles.syncHeaderRow}>
                    <View>
                        <Text style={styles.cardTitle}>Sincronizare Medicală</Text>
                        <Text style={styles.syncDesc}>
                            {isMonitoring ? "Conexiune stabilă. Medicul primește date." : "Monitorizare oprită. Apasă pentru a porni."}
                        </Text>
                        {lastSync && isMonitoring && (
                            <Text style={styles.lastSyncText}>
                                Ultimul transfer: acum {Math.floor((new Date() - lastSync) / 1000)} secunde
                            </Text>
                        )}
                    </View>
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <Ionicons name="heart-circle" size={50} color={isMonitoring ? "#48bb78" : "#cbd5e0"} />
                    </Animated.View>
                </View>

                <TouchableOpacity 
                    style={[styles.syncButton, isMonitoring ? styles.syncButtonStop : styles.syncButtonStart]} 
                    onPress={toggleMonitoring}
                >
                    <Text style={styles.syncButtonText}>{isMonitoring ? "Oprește Monitorizarea" : "Pornește Monitorizarea"}</Text>
                </TouchableOpacity>
            </View>

            {/* Planul de Azi */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Planul de Azi</Text>
                <Text style={styles.syncDesc}>Medicație și sarcini de efectuat</Text>

                {tasks.length === 0 ? (
                    <Text style={{ marginTop: 15, color: '#718096', fontStyle: 'italic' }}>
                        Niciun tratament planificat.
                    </Text>
                ) : (
                    tasks.map(task => (
                        <View key={task.id} style={styles.taskRow}>
                            <View style={styles.taskInfo}>
                                <Ionicons name={task.done ? "checkmark-circle" : "medical"} size={24} color={task.done ? "#48bb78" : "#3182ce"} />
                                <View style={{marginLeft: 10}}>
                                    <Text style={[styles.taskName, task.done && styles.taskDone]}>{task.name}</Text>
                                    <Text style={styles.taskTime}>Frecvență: {task.time}</Text>
                                </View>
                            </View>
                            {!task.done && (
                                <TouchableOpacity style={styles.confirmButton} onPress={() => confirmTask(task.id)}>
                                    <Text style={styles.confirmText}>Confirmă</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))
                )}
            </View>

            {/* Buton SOS */}
            <TouchableOpacity style={styles.sosButton} onPress={handleSos}>
                <Ionicons name="warning" size={24} color="white" />
                <Text style={styles.sosText}>Urgență / Sună Medic</Text>
            </TouchableOpacity>

            <View style={{height: 40}} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f7f6', paddingHorizontal: 15 },
    header: { paddingTop: 60, paddingBottom: 20 },
    date: { color: '#718096', fontSize: 14, textTransform: 'capitalize' },
    title: { color: '#2d3748', fontSize: 28, fontWeight: 'bold', marginTop: 5 },
    
    card: { backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width:0, height:2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    syncHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#2d3748', marginBottom: 4 },
    syncDesc: { color: '#718096', fontSize: 13, maxWidth: '80%' },
    lastSyncText: { color: '#48bb78', fontSize: 12, marginTop: 4, fontWeight: '500' },
    syncButton: { padding: 12, borderRadius: 10, alignItems: 'center' },
    syncButtonStart: { backgroundColor: '#e2e8f0' },
    syncButtonStop: { backgroundColor: '#fed7d7' },
    syncButtonText: { fontWeight: 'bold', color: '#2d3748' },

    taskRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f7fafc', padding: 15, borderRadius: 12, marginTop: 10 },
    taskInfo: { flexDirection: 'row', alignItems: 'center' },
    taskName: { fontSize: 16, fontWeight: 'bold', color: '#2d3748' },
    taskDone: { textDecorationLine: 'line-through', color: '#a0aec0' },
    taskTime: { fontSize: 12, color: '#718096' },
    confirmButton: { backgroundColor: '#3182ce', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
    confirmText: { color: 'white', fontWeight: 'bold', fontSize: 13 },

    sosButton: { backgroundColor: '#e53e3e', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, marginTop: 10 },
    sosText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 10 }
});