import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import BackendApiAdapter from '../../infrastructure/api/BackendApiAdapter';

const backendApiAdapter = new BackendApiAdapter();

export default function WardenHistoryScreen({ navigation }) {
    const screenWidth = Dimensions.get("window").width;
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [vitalsData, setVitalsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [timeFilter, setTimeFilter] = useState('1h'); // '1h', '7d'

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
        setRefreshing(false);
        setLoading(false);
    };

    const handleSelectPatient = async (patient) => {
        setSelectedPatient(patient);
        try {
            const res = await backendApiAdapter.getPatientVitals(patient._id);
            if (res.success) {
                setVitalsData(res.data || []);
            }
        } catch(e) {
            console.log(e);
        }
    };

    const chartConfig = {
        backgroundGradientFrom: "#fff",
        backgroundGradientTo: "#fff",
        color: (opacity = 1) => `rgba(229, 62, 62, ${opacity})`,
        strokeWidth: 2, // optional, default 3
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        labelColor: (opacity = 1) => `rgba(113, 128, 150, ${opacity})`,
    };

    const getFilteredData = () => {
        const heartRates = vitalsData.filter(v => v.type === 'heart_rate');
        if (heartRates.length === 0) return { labels: ["Nu apar date"], data: [0] };

        // Sort crescator pt grafic 
        heartRates.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        let filtered = [];
        const now = new Date();
        if (timeFilter === '1h') {
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
            filtered = heartRates.filter(v => new Date(v.timestamp) >= oneHourAgo);
        } else {
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filtered = heartRates.filter(v => new Date(v.timestamp) >= sevenDaysAgo);
        }

        if (filtered.length === 0) return { labels: ["-"], data: [0] };
        
        // Daca sunt prea multe puncte, luam un sample
        let sampled = filtered;
        if (filtered.length > 7) {
            const step = Math.floor(filtered.length / 7);
            sampled = filtered.filter((_, i) => i % step === 0).slice(0, 7);
        }

        return {
            labels: sampled.map(v => new Date(v.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})),
            data: sampled.map(v => v.value)
        };
    };

    const chartDataValues = getFilteredData();

    const data = {
        labels: chartDataValues.labels,
        datasets: [
            {
                data: chartDataValues.data,
                color: (opacity = 1) => `rgba(229, 62, 62, ${opacity})`,
                strokeWidth: 2
            }
        ],
        legend: ["Puls mediu (bpm)"] 
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Istoric & Evoluție</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#48bb78" style={{marginTop: 50}} />
            ) : patients.length === 0 ? (
                <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30}}>
                    <Ionicons name="people" size={60} color="#cbd5e0" />
                    <Text style={{fontSize: 18, fontWeight: 'bold', color: '#4a5568', marginTop: 15}}>Nu ai niciun pacient asociat.</Text>
                </View>
            ) : (
                <ScrollView 
                    style={{ paddingBottom: 30 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={fetchPatients} colors={["#48bb78"]} />
                    }
                >
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

                    <View style={{ padding: 15 }}>
                        <View style={styles.filterCard}>
                            <Text style={styles.filterLabel}>Filtrare Date</Text>
                            <View style={styles.filters}>
                                <TouchableOpacity 
                                    style={[styles.filterChip, timeFilter === '1h' && styles.filterChipActive]}
                                    onPress={() => setTimeFilter('1h')}
                                >
                                    <Text style={[styles.filterText, timeFilter === '1h' && styles.filterTextActive]}>Ultima Oră</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.filterChip, timeFilter === '7d' && styles.filterChipActive]}
                                    onPress={() => setTimeFilter('7d')}
                                >
                                    <Text style={[styles.filterText, timeFilter === '7d' && styles.filterTextActive]}>Ultimele 7 Zile</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Grafic real din react-native-chart-kit */}
                        <View style={styles.chartContainer}>
                            <Text style={styles.chartTitle}>Evoluție Puls</Text>
                            <LineChart
                                data={data}
                                width={screenWidth - 60}
                                height={220}
                                chartConfig={chartConfig}
                                bezier
                                style={{
                                    marginVertical: 8,
                                    borderRadius: 16
                                }}
                            />
                        </View>

                        <Text style={styles.sectionTitle}>Rapoarte Generate</Text>

                        <TouchableOpacity style={styles.reportRow}>
                            <Ionicons name="document-text" size={30} color="#4299e1" />
                            <View style={{marginLeft: 15, flex: 1}}>
                                <Text style={styles.reportTitle}>Raport Săptămânal - {selectedPatient?.name}</Text>
                                <Text style={styles.reportDate}>Generat: astăzi</Text>
                            </View>
                            <Ionicons name="download-outline" size={24} color="#718096" />
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f7f6' },
    header: { paddingTop: 60, paddingBottom: 15, paddingHorizontal: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#edf2f7' },
    title: { color: '#2d3748', fontSize: 24, fontWeight: 'bold' },
    
    filterCard: { backgroundColor: 'white', padding: 15, borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width:0, height:1 }, shadowOpacity: 0.05, elevation: 2 },
    filterLabel: { color: '#718096', fontWeight: 'bold', textTransform: 'uppercase', fontSize: 12, marginBottom: 10, letterSpacing: 1 },
    filters: { flexDirection: 'row', flexWrap: 'wrap' },
    filterChip: { backgroundColor: '#edf2f7', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10, marginBottom: 10 },
    filterChipActive: { backgroundColor: '#3182ce' },
    filterText: { color: '#4a5568', fontWeight: '600', fontSize: 13 },
    filterTextActive: { color: 'white', fontWeight: 'bold', fontSize: 13 },

    chartContainer: { backgroundColor: 'white', borderRadius: 16, padding: 15, marginBottom: 20, shadowColor: '#000', shadowOffset: { width:0, height:1 }, shadowOpacity: 0.05, elevation: 2, alignItems: 'center' },
    chartTitle: { fontSize: 15, fontWeight: 'bold', color: '#2d3748', alignSelf: 'flex-start', marginBottom: 10 },

    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#718096', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15 },
    reportRow: { backgroundColor: 'white', padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 10, shadowColor: '#000', shadowOffset: { width:0, height:1 }, shadowOpacity: 0.05, elevation: 1 },
    reportTitle: { fontSize: 15, fontWeight: 'bold', color: '#2d3748' },
    reportDate: { fontSize: 13, color: '#a0aec0', marginTop: 3 },

    patientSelectorRow: { paddingHorizontal: 15, marginVertical: 15, maxHeight: 50 },
    patientChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e2e8f0', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10 },
    patientChipActive: { backgroundColor: '#48bb78' },
    patientChipText: { marginLeft: 5, fontSize: 14, fontWeight: 'bold', color: '#4a5568' },
    patientChipTextActive: { color: 'white' },
});