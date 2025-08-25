// Manejo del estado de la aplicación
class AppState {
    constructor() {
        this.state = {
            selectedSemesters: [],
            selectedCourses: {},
            courseSchedules: {},
            generatedCombinations: [],
            currentPreview: null
        };
        
        // Intentar cargar estado guardado
        this.loadFromStorage();
        
        // Configurar autoguardado
        setInterval(() => this.saveToStorage(), 30000);
    }
    
    // Getters
    get selectedSemesters() { return this.state.selectedSemesters; }
    get selectedCourses() { return this.state.selectedCourses; }
    get courseSchedules() { return this.state.courseSchedules; }
    get generatedCombinations() { return this.state.generatedCombinations; }
    get currentPreview() { return this.state.currentPreview; }
    
    // Setters con validación
    set selectedSemesters(value) {
        if (!Array.isArray(value)) throw new Error('selectedSemesters debe ser un array');
        this.state.selectedSemesters = value;
        this.saveToStorage();
    }
    
    set selectedCourses(value) {
        if (typeof value !== 'object') throw new Error('selectedCourses debe ser un objeto');
        this.state.selectedCourses = value;
        this.saveToStorage();
    }
    
    set courseSchedules(value) {
        if (typeof value !== 'object') throw new Error('courseSchedules debe ser un objeto');
        this.state.courseSchedules = value;
        this.saveToStorage();
    }
    
    set currentPreview(value) {
        this.state.currentPreview = value;
    }
    
    // Persistencia
    saveToStorage() {
        try {
            localStorage.setItem('appState', JSON.stringify(this.state));
        } catch (e) {
            console.warn('No se pudo guardar el estado:', e);
        }
    }
    
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('appState');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (this.validateState(parsed)) {
                    this.state = parsed;
                }
            }
        } catch (e) {
            console.warn('No se pudo cargar el estado guardado:', e);
        }
    }
    
    // Validación
    validateState(state) {
        if (!state || typeof state !== 'object') return false;
        
        // Validar estructura básica
        const requiredKeys = ['selectedSemesters', 'selectedCourses', 'courseSchedules'];
        if (!requiredKeys.every(key => key in state)) return false;
        
        // Validar tipos
        if (!Array.isArray(state.selectedSemesters)) return false;
        if (typeof state.selectedCourses !== 'object') return false;
        if (typeof state.courseSchedules !== 'object') return false;
        
        // Validar semestres
        if (!state.selectedSemesters.every(sem => 
            typeof sem === 'string' && 
            Object.keys(PLAN_ESTUDIOS).includes(sem)
        )) return false;
        
        // Validar cursos
        for (const code of Object.keys(state.selectedCourses)) {
            let exists = false;
            for (const semester of Object.values(PLAN_ESTUDIOS)) {
                if (semester[code]) {
                    exists = true;
                    break;
                }
            }
            if (!exists) return false;
        }
        
        return true;
    }
    
    // Importación/Exportación
    importFromJson(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (!this.validateState(data)) {
                throw new Error('Formato de archivo inválido');
            }
            
            // Backup del estado actual
            const backup = { ...this.state };
            
            try {
                this.state = {
                    ...this.state,
                    selectedSemesters: data.selectedSemesters,
                    selectedCourses: data.selectedCourses,
                    courseSchedules: data.courseSchedules,
                    generatedCombinations: [] // Limpiar combinaciones previas
                };
                
                return true;
                
            } catch (error) {
                // Restaurar backup si algo sale mal
                this.state = backup;
                throw error;
            }
            
        } catch (error) {
            console.error('Error al importar estado:', error);
            throw new Error('Error al importar: ' + error.message);
        }
    }
    
    exportToJson() {
        try {
            return JSON.stringify({
                version: '1.0',
                timestamp: new Date().toISOString(),
                selectedSemesters: this.state.selectedSemesters,
                selectedCourses: this.state.selectedCourses,
                courseSchedules: this.state.courseSchedules,
                metadata: {
                    totalCourses: Object.keys(this.state.selectedCourses).length,
                    totalCredits: Object.values(this.state.selectedCourses)
                        .reduce((sum, course) => sum + course.creditos, 0),
                    semester: this.state.selectedSemesters[0]?.includes('Primer') ? 'impar' : 'par'
                }
            }, null, 2);
            
        } catch (error) {
            console.error('Error al exportar estado:', error);
            throw new Error('Error al exportar la configuración');
        }
    }
    
    // Utilidades
    reset() {
        this.state = {
            selectedSemesters: [],
            selectedCourses: {},
            courseSchedules: {},
            generatedCombinations: [],
            currentPreview: null
        };
        this.saveToStorage();
    }
}

// Instancia global
const appState = new AppState();
