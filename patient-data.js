// Patient Data Manager - Local Storage Management
class PatientDataManager {
    constructor() {
        this.storageKey = 'mediroute_patients';
        this.driverKey = 'mediroute_current_driver';
    }

    // Get all patients from localStorage
    getPatients() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading patients:', error);
            return [];
        }
    }

    // Get pending patients only
    getPendingPatients() {
        return this.getPatients().filter(patient => 
            patient.status === 'pending' || patient.status === 'sent_to_hospital'
        );
    }

    // Add new patient
    addPatient(patientData) {
        const patients = this.getPatients();
        const currentDriver = this.getCurrentDriver();
        
        const newPatient = {
            id: this.generateId(),
            ...patientData,
            status: 'pending',
            timestamp: new Date().toISOString(),
            // Add driver information
            driverName: currentDriver?.driverName || 'Unknown Driver',
            driverPhone: currentDriver?.phone || 'N/A',
            driverEmail: currentDriver?.email || 'N/A',
            driverLicense: currentDriver?.licenceNumber || 'N/A'
        };
        
        patients.push(newPatient);
        this.savePatients(patients);
        return newPatient.id;
    }

    // Update patient status
    updatePatientStatus(patientId, status, reason = null) {
        const patients = this.getPatients();
        const patientIndex = patients.findIndex(p => p.id === patientId);
        
        if (patientIndex !== -1) {
            patients[patientIndex].status = status;
            patients[patientIndex].updatedAt = new Date().toISOString();
            
            if (reason) {
                patients[patientIndex].reason = reason;
            }
            
            this.savePatients(patients);
            return patients[patientIndex];
        }
        return null;
    }

    // Save patients to localStorage
    savePatients(patients) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(patients));
        } catch (error) {
            console.error('Error saving patients:', error);
        }
    }

    // Generate unique ID
    generateId() {
        return 'patient_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Driver management
    setCurrentDriver(driverData) {
        try {
            localStorage.setItem(this.driverKey, JSON.stringify(driverData));
        } catch (error) {
            console.error('Error saving driver data:', error);
        }
    }

    getCurrentDriver() {
        try {
            const data = localStorage.getItem(this.driverKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading driver data:', error);
            return null;
        }
    }

    clearCurrentDriver() {
        localStorage.removeItem(this.driverKey);
    }

    // Clear all data
    clearAllData() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.driverKey);
    }
}

// Initialize global patient data manager
window.patientDataManager = new PatientDataManager();

// Sample driver data for testing (remove in production)
if (!window.patientDataManager.getCurrentDriver()) {
    window.patientDataManager.setCurrentDriver({
        driverName: 'John Smith',
        email: 'john.smith@mediroute.com',
        phone: '(555) 123-4567',
        licenceNumber: 'DL123456789'
    });
}