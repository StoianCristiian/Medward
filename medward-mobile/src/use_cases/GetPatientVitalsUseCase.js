class GetPatientVitalsUseCase {
    constructor(backendRepository) {
        // Nu are nevoie de HealthDataRepository, deoarece va descărca informațiile strict de pe Internet
        this.backendRepository = backendRepository;
    }

    // Funcția care va fi apelată din ecranele de Warden/Doctor
    async execute(patientId) {
        try {
            if (!patientId) throw new Error('ID-ul pacientului este obligatoriu.');

            console.log(`📡 Descărcăm fișa medicală a pacientului ${patientId}`);
            
            // Apel de rețea autorizat cu JWT 
            const response = await this.backendRepository.getPatientVitals(patientId);
            
            if (response && response.success) {
                // Returnează array-ul de Vitals (formatate cronologic din MongoDB)
                return response.data;
            }
            
            throw new Error('Server-ul nu a putut trimite datele.');
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            console.error('❌ Eroare GetPatientVitalsUseCase:', errorMessage);
            throw new Error(errorMessage);
        }
    }
}

export default GetPatientVitalsUseCase;