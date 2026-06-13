import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BackendApiAdapter from '../../infrastructure/api/BackendApiAdapter';

const backendApiAdapter = new BackendApiAdapter();

export default function WardenMonitorScreen({ navigation }) {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [vitalsData, setVitalsData] = useState([]);
    const [vitalsLoading, setVitalsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchPatients();
        });
        fetchPatients();
        return unsubscribe;
    }, [navigation]);

    const fetchPatients = async () => {
        setRefreshing(true);
        try {
            const data = await backendApiAdapter.getMonitoredPatients();
            if (data.success && data.patients) {
                setPatients(data.patients);
                if (data.patients.length > 0 && !selectedPatient) {
                    handleSelectPatient(data.patients[0]);
                } else if (selectedPatient) {
                    handleSelectPatient(selectedPatient);
                }
            }
        } catch (error) {
            console.log("Eroare fetch patients", error);
        }
        setLoading(false);
        setRefreshing(false);
    };

    const handleSelectPatient = async (patient) => {
        setSelectedPatient(patient);
        setVitalsLoading(true);
        try {
            const res = await backendApiAdapter.getPatientVitals(patient._id);
            if (res.success) {
                setVitalsData(res.data || []);
            }
        } catch(e) {
            console.log(e);
        }
        setVitalsLoading(false);
    };

    // Funcții de agregare matematică simple a vitalsData
    const getLatestValue = (type) => {
        const item = vitalsData.find(v => v.type === type);
        return item ? item.value : '--';
    };

    const countAnomalies = () => {
        let alerts = [];
        vitalsData.forEach(v => {
            if (v.type === 'heart_rate' && v.value > 100) alerts.push(`Puls ridicat (${v.value} bpm) la ${new Date(v.timestamp).toLocaleTimeString()}`);
            if (v.type === 'skin_temperature' && v.value > 37.5) alerts.push(`Febră detectată (${v.value}°C)`);
            if (v.type === 'hrv_rmssd' && v.value < 20) alerts.push(`HRV foarte scăzut (${v.value} ms)`);
        });
        // Păstrăm ultimele 3 alerte unice
        return [...new Set(alerts)].slice(0, 3);
    };

    const renderCard = (title, value, unit, icon, color) => (
        <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
                <Ionicons name={icon} size={20} color={color} />
                <Text style={styles.metricTitle}>{title}</Text>
            </View>
            <View style={styles.metricBody}>
                <Text style={[styles.metricValue, { color }]}>{value}</Text>
                <Text style={styles.metricUnit}>{unit}</Text>
            </View>
        </View>
    );

    const alerts = countAnomalies();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Monitorizare Telemetrică</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#48bb78" style={{marginTop: 50}} />
            ) : patients.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="people" size={60} color="#cbd5e0" />
                    <Text style={styles.emptyText}>Nu ai niciun pacient asociat.</Text>
                    <Text style={styles.emptySub}>Mergi la 'Profil' pentru a adăuga un pacient via cod.</Text>
                </View>
            ) : (
                <ScrollView 
                    contentContainerStyle={{ paddingBottom: 30 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={fetchPatients} colors={["#48bb78"]} />
                    }
                >
                    
                    {/* Lista Orizontală de pacienți */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.patientSelectorRow}>
                        {patients.map(p => {
                            const isSelected = selectedPatient?._id === p._id;
                            return (
                                <TouchableOpacity 
                                    key={p._id} 
                                    onPress={() => handleSelectPatient(p)}
                                    style={[styles.patientChip, isSelected && styles.patientChipActive]}
                                >
                                    <Ionicons name="person-circle" size={24} color={isSelected ? "white" : "#4a5568"} />
                                    <Text style={[styles.patientChipText, isSelected && styles.patientChipTextActive]}>
                                        {p.name.split(' ')[0]}
                                    </Text>
                                </TouchableOpacity>
                            )
                        })}
                    </ScrollView>

                    {vitalsLoading ? (
                        <ActivityIndicator size="large" color="#48bb78" style={{marginTop: 40}} />
                    ) : selectedPatient ? (
                        <View style={{ paddingHorizontal: 15 }}>
                            
                            {/* Panou Alerte */}
                            {alerts.length > 0 && (
                                <View style={styles.alertCard}>
                                    <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 10}}>
                                        <Ionicons name="warning" size={20} color="#e53e3e" />
                                        <Text style={styles.alertTitle}>Alerte Recente</Text>
                                    </View>
                                    {alerts.map((alt, i) => (
                                        <Text key={i} style={styles.alertText}>• {alt}</Text>
                                    ))}
                                </View>
                            )}

                            <Text style={styles.sectionHeader}>Metrici Curente (Ultima Oră)</Text>
                            
                            <View style={styles.grid}>
                                {renderCard("Puls", getLatestValue('heart_rate'), "bpm", "heart", "#e53e3e")}
                                {renderCard("Temp", getLatestValue('skin_temperature'), "°C", "thermometer", "#ed8936")}
                                {renderCard("Respirație", getLatestValue('respiratory_rate'), "rpm", "leaf", "#3182ce")}
                                {renderCard("HRV (Rmssd)", getLatestValue('hrv_rmssd'), "ms", "pulse", "#805ad5")}
                                {renderCard("Puls Repaus", getLatestValue('resting_heart_rate'), "bpm", "bed", "#4fd1c5")}
                            </View>

                            <Text style={styles.sectionHeader}>Complianță Tratament (Azi)</Text>
                            <View style={styles.complianceCard}>
                                <View style={styles.progressCircle}>
                                    <Text style={styles.progressText}>75%</Text>
                                </View>
                                <View style={{flex: 1, marginLeft: 20}}>
                                    <Text style={styles.complianceDesc}>Pacientul a confirmat 3 din 4 medicamente planificate astăzi.</Text>
                                </View>
                            </View>

                        </View>
                    ) : null}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f7f6' },
    header: { paddingTop: 60, paddingBottom: 15, paddingHorizontal: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#edf2f7' },
    title: { color: '#2d3748', fontSize: 24, fontWeight: 'bold' },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
    emptyText: { fontSize: 18, fontWeight: 'bold', color: '#4a5568', marginTop: 15 },
    emptySub: { fontSize: 14, color: '#a0aec0', textAlign: 'center', marginTop: 10 },
    
    patientSelectorRow: { padding: 15, maxHeight: 80 },
    patientChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 25, marginRight: 15, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width:0, height:1 }, shadowOpacity: 0.05, elevation: 1 },
    patientChipActive: { backgroundColor: '#48bb78', borderColor: '#48bb78' },
    patientChipText: { marginLeft: 8, fontSize: 15, fontWeight: '600', color: '#4a5568' },
    patientChipTextActive: { color: 'white' },

    alertCard: { backgroundColor: '#fed7d7', padding: 15, borderRadius: 12, marginBottom: 20 },
    alertTitle: { fontSize: 16, fontWeight: 'bold', color: '#c53030', marginLeft: 8 },
    alertText: { color: '#9b2c2c', fontSize: 14, marginBottom: 4 },

    sectionHeader: { fontSize: 16, fontWeight: 'bold', color: '#718096', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15, marginTop: 10 },
    
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    metricCard: { width: '48%', backgroundColor: 'white', padding: 15, borderRadius: 16, marginBottom: 15, shadowColor: '#000', shadowOffset: { width:0, height:2 }, shadowOpacity: 0.05, elevation: 2 },
    metricHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    metricTitle: { marginLeft: 8, fontSize: 14, color: '#718096', fontWeight: 'bold' },
    metricBody: { flexDirection: 'row', alignItems: 'baseline' },
    metricValue: { fontSize: 28, fontWeight: '900' },
    metricUnit: { fontSize: 14, color: '#a0aec0', marginLeft: 5, fontWeight: '600' },

    complianceCard: { backgroundColor: 'white', padding: 20, borderRadius: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width:0, height:2 }, shadowOpacity: 0.05, elevation: 2 },
    progressCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 8, borderColor: '#48bb78', justifyContent: 'center', alignItems: 'center' },
    progressText: { fontSize: 20, fontWeight: 'bold', color: '#2d3748' },
    complianceDesc: { fontSize: 14, color: '#4a5568', lineHeight: 20 }
});