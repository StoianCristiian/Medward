import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';

export default function WardenHistoryScreen() {
    const screenWidth = Dimensions.get("window").width;

    const chartConfig = {
        backgroundGradientFrom: "#fff",
        backgroundGradientTo: "#fff",
        color: (opacity = 1) => `rgba(229, 62, 62, ${opacity})`,
        strokeWidth: 2, // optional, default 3
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        labelColor: (opacity = 1) => `rgba(113, 128, 150, ${opacity})`,
    };

    const data = {
        labels: ["Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum"],
        datasets: [
            {
                data: [72, 75, 78, 70, 74, 90, 71],
                color: (opacity = 1) => `rgba(229, 62, 62, ${opacity})`, // linie rosiatica
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

            <ScrollView style={{ padding: 15 }}>
                <View style={styles.filterCard}>
                    <Text style={styles.filterLabel}>Filtrare Date</Text>
                    <View style={styles.filters}>
                        <TouchableOpacity style={[styles.filterChip, styles.filterChipActive]}><Text style={styles.filterTextActive}>Ultimele 7 Zile</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.filterChip}><Text style={styles.filterText}>Luna Trecută</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.filterChip}><Text style={styles.filterText}>Personalizat</Text></TouchableOpacity>
                    </View>
                </View>

                {/* Grafic real din react-native-chart-kit */}
                <View style={styles.chartContainer}>
                    <Text style={styles.chartTitle}>Evoluție Metrică</Text>
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
                        <Text style={styles.reportTitle}>Raport Săptămânal - Andrei Popescu</Text>
                        <Text style={styles.reportDate}>Generat: 06 Iunie 2026</Text>
                    </View>
                    <Ionicons name="download-outline" size={24} color="#718096" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.reportRow}>
                    <Ionicons name="document-text" size={30} color="#4299e1" />
                    <View style={{marginLeft: 15, flex: 1}}>
                        <Text style={styles.reportTitle}>Raport Lunar - Marius Radu</Text>
                        <Text style={styles.reportDate}>Generat: 01 Iunie 2026</Text>
                    </View>
                    <Ionicons name="download-outline" size={24} color="#718096" />
                </TouchableOpacity>

            </ScrollView>
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
    reportDate: { fontSize: 13, color: '#a0aec0', marginTop: 3 }
});