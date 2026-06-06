import React, { useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const IP = process.env.EXPO_PUBLIC_BACKEND_IP;
const PORT = process.env.EXPO_PUBLIC_BACKEND_PORT;
const BACKEND_LOGIN_URL = `http://${IP}:${PORT}/api/auth/google`;

export default function LoginScreen({ navigation }) {
    useEffect(() => {
        // Configurăm componenta nativă
        GoogleSignin.configure({
            webClientId: '657775272800-ip22ue44g3b3feauvd800en747oo8s1h.apps.googleusercontent.com', // Trebuie acel id de tip WEB, NU cel de Android!
            offlineAccess: true, 
        });
    }, []);

    async function handleSignInWithGoogle() {
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            const idToken = userInfo.data?.idToken || userInfo.idToken;

            // Trimitem token-ul de acces/ID la propriul nostru server backend
            const res = await axios.post(BACKEND_LOGIN_URL, {
                // Notă: Modificăm backendul să accepte idToken direct sau vom lăsa accessToken = idToken doar pentru test ca backendul de Google să spargă payloadul
                // Dar pentru simplitate îl trimitem pe același field pe care backendul îl așteaptă momentan
                accessToken: idToken 
            });

            if (res.data.success) {
                await AsyncStorage.setItem('userToken', res.data.token);
                await AsyncStorage.setItem('userRole', res.data.user.role);
                // Întrebăm direct navigatorul să decidă ce ecran încarcă mai jos, dar noi redirecționăm către "Home" (care va deveni un dispatcher)
                navigation.replace('Home');
            }
        } catch (error) {
            console.error("Eroare la autentificare:", error.message);
            Alert.alert("Autentificarea a eșuat", "Asigură-te că ești conectat la internet și încearcă din nou.");
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>MedWard</Text>
            <Text style={styles.subtitle}>Conectează-te pentru a-ți sincroniza datele de sănătate</Text>

            <TouchableOpacity 
                style={styles.googleButton} 
                onPress={handleSignInWithGoogle}
            >
                <Text style={styles.buttonText}>Conectare cu Google</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a202c',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10
    },
    subtitle: {
        fontSize: 16,
        color: '#a0aec0',
        textAlign: 'center',
        marginBottom: 50,
        paddingHorizontal: 20
    },
    googleButton: {
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    buttonText: {
        color: '#444',
        fontSize: 18,
        fontWeight: 'bold'
    }
});