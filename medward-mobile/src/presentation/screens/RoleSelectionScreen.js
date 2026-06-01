import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackendApiAdapter from '../../infrastructure/api/BackendApiAdapter';

export default function RoleSelectionScreen({ navigation }) {
    const handleSelectRole = async (role) => {
        try {
            const api = new BackendApiAdapter();
            const res = await api.setRole(role);
            
            if (res.success) {
                await AsyncStorage.setItem('userRole', role);
                navigation.replace(role === 'patient' ? 'PatientDashboard' : 'WardenDashboard');
            } else {
                Alert.alert('Eroare', 'Nu s-a putut salva rolul.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Eroare', 'Eroare la rețea.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Buna!</Text>
            <Text style={styles.subtitle}>Te rugăm să alegi cum vei folosi aplicația:</Text>

            <TouchableOpacity style={styles.button} onPress={() => handleSelectRole('patient')}>
                <Text style={styles.buttonText}>Sunt Pacient</Text>
                <Text style={styles.subText}>Culege și trimite semnele vitale către medicul tău</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.wardenButton]} onPress={() => handleSelectRole('warden')}>
                <Text style={styles.buttonText}>Sunt Medic / Supervizor</Text>
                <Text style={styles.subText}>Supraveghează pacienții și primește alerte</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a202c',
        justifyContent: 'center',
        padding: 20
    },
    title: { color: 'white', fontSize: 30, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
    subtitle: { color: '#a0aec0', fontSize: 16, marginBottom: 40, textAlign: 'center' },
    button: {
        backgroundColor: '#4299e1',
        padding: 20,
        borderRadius: 15,
        marginBottom: 20,
    },
    wardenButton: {
        backgroundColor: '#48bb78',
    },
    buttonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    subText: {
        color: 'white',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 5,
        opacity: 0.9
    }
});