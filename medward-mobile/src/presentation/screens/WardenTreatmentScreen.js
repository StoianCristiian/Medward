import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BackendApiAdapter from '../../infrastructure/api/BackendApiAdapter';

const backendApiAdapter = new BackendApiAdapter();

export default function WardenTreatmentScreen({ navigation }) {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [treatments, setTreatments] = useState([]);
    const [treatmentsLoading, setTreatmentsLoading] = useState(false);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchPatients();
        });
        fetchPatients();
        return unsubscribe;
    }, [navigation]);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const data = await backendApiAdapter.getMonitoredPatients();
            if (data.success && data.patients) {
                setPatients(data.patients);
                if (data.patients.length > 0 && !selectedPatient) {
                    handleSelectPatient(data.patients[0]);
                }
            }
        } catch (error) {
            console.log("Eroare fetch patients", error);
        }
        setLoading(false);
    };

    const handleSelectPatient = async (patient) => {
        setSelectedPatient(patient);
        setTreatmentsLoading(true);
        try {
            const res = await backendApiAdapter.getTreatments(patient._id);
            if (res.success) {
                setTreatments(res.treatments || []);
            }
        } catch(e) {
            console.log(e);
        }
        setTreatmentsLoading(false);
    };

    const handleAddTreatment = async () => {
        if (!selectedPatient) return Alert.alert("Eroare", "Selectează un pacient.");
        Alert.prompt(
            "Medicație Nouă",
            "Introduceți numele medicamentului (ex: Nurofen 500mg)",
            [
                { text: "Anulare", style: "cancel" },
                {
                    text: "Adaugă",
                    onPress: async (name) => {
                        if (!name) return;
                        try {
                            const res = await backendApiAdapter.addTreatment(selectedPatient._id, {
                                medicationName: name,
                                frequency: "Zilnic, ora 08:00",
                                stock: 30
                            });
                            if (res.success) {
                                handleSelectPatient(selectedPatient);
                            }
                        } catch (e) {
                            Alert.alert("Eroare", "Nu s-a putut adăuga tratamentul.");
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Prescripții & Tratament</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#48bb78" style={{marginTop: 50}} />
            ) : patients.length === 0 ? (
                <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30}}>
                    <Ionicons name="people" size={60} color="#cbd5e0" />
                    <Text style={{fontSize: 18, fontWeight: 'bold', color: '#4a5568', marginTop: 15}}>Nu ai niciun pacient asociat.</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
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

                    {treatmentsLoading ? (
                        <ActivityIndicator size="large" color="#48bb78" style={{marginTop: 40}} />
                    ) : selectedPatient ? (
                        <View style={{ paddingHorizontal: 15 }}>
                            <TouchableOpacity style={styles.addButton} onPress={handleAddTreatment}>
                                <Ionicons name="add-circle" size={24} color="white" />
                                <Text style={styles.addText}>Adaugă Medicație Nouă</Text>
                            </TouchableOpacity>

                            <Text style={styles.sectionTitle}>Tratament Activ (Azi)</Text>

                            {treatments.length === 0 ? (
                                <Text style={{color: '#a0aec0', fontStyle: 'italic'}}>Niciun tratament înregistrat.</Text>
                            ) : treatments.map(t => (
                                <View key={t._id} style={styles.medCard}>
                                    <View style={styles.medHeader}>
                                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                            <Ionicons name="medical" size={24} color="#ed8936" />
                                            <Text style={styles.medName}>{t.medicationName}</Text>
                                        </View>
                                        <TouchableOpacity><Ionicons name="ellipsis-horizontal" size={20} color="#a0aec0" /></TouchableOpacity>
                                    </View>
                                    <View style={styles.rulesContainer}>
                                        <Text style={styles.ruleText}>Frecvență: {t.frequency}</Text>
                                        <Text style={styles.ruleText}>Stoc rămas: {t.stock} unități</Text>
                                    </View>
                                    <View style={styles.complianceTracker}>
                                        <View style={styles.bubbleWait} />
                                    </View>
                                </View>
                            ))}
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
    
    patientSelectorRow: { padding: 15, maxHeight: 80 },
    patientChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 25, marginRight: 15, borderWidth: 1, borderColor: '#e2e8f0' },
    patientChipActive: { backgroundColor: '#48bb78', borderColor: '#48bb78' },
    patientChipText: { marginLeft: 8, fontSize: 15, fontWeight: '600', color: '#4a5568' },
    patientChipTextActive: { color: 'white' },

    addButton: { backgroundColor: '#48bb78', padding: 15, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 25, shadowColor: '#48bb78', shadowOffset: { width:0, height:4 }, shadowOpacity: 0.3, shadowRadius: 5 },
    addText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },

    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#718096', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15 },
    
    medCard: { backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 15, shadowColor: '#000', shadowOffset: { width:0, height:2 }, shadowOpacity: 0.05, elevation: 2 },
    medHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    medName: { fontSize: 18, fontWeight: 'bold', color: '#2d3748', marginLeft: 10 },
    rulesContainer: { backgroundColor: '#f7fafc', padding: 15, borderRadius: 8, marginBottom: 15 },
    ruleText: { color: '#4a5568', fontSize: 14, marginBottom: 5 },
    
    complianceTracker: { flexDirection: 'row' },
    bubbleTrue: { width: 30, height: 10, backgroundColor: '#48bb78', borderRadius: 5, marginRight: 5 },
    bubbleFalse: { width: 30, height: 10, backgroundColor: '#e53e3e', borderRadius: 5, marginRight: 5 },
    bubbleWait: { width: 30, height: 10, backgroundColor: '#e2e8f0', borderRadius: 5, marginRight: 5 },
});