import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import BackendApiAdapter from '../../infrastructure/api/BackendApiAdapter';
import HealthConnectAdapter from '../../infrastructure/health_connect/HealthConnectAdapter';

const backendApiAdapter = new BackendApiAdapter();
const healthConnectAdapter = new HealthConnectAdapter();

export default function PatientConnectionsScreen() {
    const [pairingCode, setPairingCode] = useState(null);
    const [codeLoading, setCodeLoading] = useState(false);

    const handleGenerateCode = async () => {
        setCodeLoading(true);
        try {
            const res = await backendApiAdapter.generatePairingCode();
            if (res.success) {
                setPairingCode(res.code);  
            }
        } catch (e) {
            Alert.alert('Eroare', 'Nu s-a putut genera codul.');
        }
        setCodeLoading(false);
    };

    const handleCheckPermissions = async () => {
        try {
            await healthConnectAdapter.requestPermissions();
            Alert.alert("Succes", "Permisiunile au fost actualizate / validate cu succes în baza Google Health Connect.");
        } catch (e) {
            Alert.alert("Eroare", "Health Connect nu a putut valida permisiunile.");
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Conexiuni & Partajare</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Sursa Datelor (Health Connect)</Text>
                <Text style={styles.desc}>Aplicația citește pași, puls, respirație și temperatură direct din telefonul tău, securizat.</Text>
                <TouchableOpacity style={styles.buttonSecondary} onPress={handleCheckPermissions}>
                    <Text style={styles.buttonTextSecondary}>Verifică Permisiuni Health Connect</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Asociază un Medic</Text>
                <Text style={styles.desc}>Generează un cod unic (valabil 15 minute) și oferă-l medicului sau aparținătorului tău pentru a te putea monitoriza.</Text>
                
                {pairingCode ? (
                    <View style={styles.codeContainer}>
                        <Text style={styles.codeText}>{pairingCode}</Text>
                    </View>
                ) : null}

                <TouchableOpacity 
                    style={[styles.buttonPrimary, codeLoading && { opacity: 0.7 }]} 
                    onPress={handleGenerateCode}
                    disabled={codeLoading}
                >
                    {codeLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonTextPrimary}>Generează Cod Nou</Text>}
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
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#2d3748', marginBottom: 8 },
    desc: { color: '#718096', fontSize: 14, marginBottom: 20, lineHeight: 20 },
    
    buttonSecondary: { backgroundColor: '#edf2f7', padding: 15, borderRadius: 12, alignItems: 'center' },
    buttonTextSecondary: { color: '#2b6cb0', fontWeight: 'bold', fontSize: 15 },
    
    buttonPrimary: { backgroundColor: '#48bb78', padding: 15, borderRadius: 12, alignItems: 'center' },
    buttonTextPrimary: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    codeContainer: { backgroundColor: '#f0fff4', padding: 20, borderRadius: 12, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#c6f6d5' },
    codeText: { fontSize: 36, fontWeight: '900', letterSpacing: 8, color: '#276749' }
});