// Constantes
const TIME_SLOTS = [
    { start: "07:00", end: "07:50" },
    { start: "07:50", end: "08:40" },
    { start: "08:50", end: "09:40" },
    { start: "09:40", end: "10:30" },
    { start: "10:40", end: "11:30" },
    { start: "11:30", end: "12:20" },
    { start: "12:30", end: "13:20" },
    { start: "13:20", end: "14:10" },
    { start: "14:20", end: "15:10" },
    { start: "15:10", end: "16:00" },
    { start: "16:10", end: "17:00" },
    { start: "17:00", end: "17:50" },
    { start: "18:00", end: "18:50" },
    { start: "18:50", end: "19:40" },
    { start: "19:50", end: "20:40" },
    { start: "20:40", end: "21:30" }
];

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

// Validadores y utilidades
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

function validateScheduleData(data) {
    // Validar estructura básica
    if (!data || typeof data !== 'object') return false;
    if (!data.selectedSemesters || !Array.isArray(data.selectedSemesters)) return false;
    if (!data.selectedCourses || typeof data.selectedCourses !== 'object') return false;
    if (!data.courseSchedules || typeof data.courseSchedules !== 'object') return false;

    // Validar semestres
    if (!data.selectedSemesters.every(sem => 
        Object.keys(PLAN_ESTUDIOS).includes(sem))) return false;

    // Validar cursos
    for (const code of Object.keys(data.selectedCourses)) {
        let courseExists = false;
        for (const semester of Object.values(PLAN_ESTUDIOS)) {
            if (semester[code]) {
                courseExists = true;
                break;
            }
        }
        if (!courseExists) return false;
    }

    // Validar horarios
    for (const code of Object.keys(data.courseSchedules)) {
        for (const group of Object.values(data.courseSchedules[code])) {
            if (!group.schedules || !Array.isArray(group.schedules)) return false;
            
            for (const schedule of group.schedules) {
                if (!schedule.day || !DAYS.includes(schedule.day)) return false;
                if (!schedule.start || !schedule.end) return false;
                
                const start = timeToMinutes(schedule.start);
                const end = timeToMinutes(schedule.end);
                if (isNaN(start) || isNaN(end) || start >= end) return false;
            }
        }
    }

    return true;
}

function exportarConfiguracion() {
    try {
        // Validar que hay datos para exportar
        if (Object.keys(appState.selectedCourses).length === 0) {
            showToast('No hay cursos seleccionados para exportar', 'warning');
            return;
        }

        const config = {
            version: '1.1',
            timestamp: new Date().toISOString(),
            selectedSemesters: appState.selectedSemesters,
            selectedCourses: appState.selectedCourses,
            courseSchedules: appState.courseSchedules,
            metadata: {
                totalCourses: Object.keys(appState.selectedCourses).length,
                totalCredits: Object.values(appState.selectedCourses)
                    .reduce((sum, course) => sum + course.creditos, 0),
                semester: appState.selectedSemesters[0]?.includes('Primer') ? 'impar' : 'par'
            }
        };

        // Convertir a Blob para mejor manejo de caracteres especiales
        const jsonStr = JSON.stringify(config, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
        
        // Crear URL y link para descarga
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `horario_${new Date().toISOString().split('T')[0]}.json`;
        
        // Simular click y limpiar
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showToast('Configuración exportada exitosamente');
        
    } catch (error) {
        console.error('Error al exportar:', error);
        showToast('Error al exportar la configuración: ' + error.message, 'error');
    }
}

function importarConfiguracion() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.name.endsWith('.json')) {
            showToast('Por favor selecciona un archivo JSON válido', 'error');
            return;
        }
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (!validateScheduleData(data)) {
                throw new Error('El archivo contiene datos inválidos o incompatibles');
            }
            
            // Backup del estado actual
            const prevState = {
                selectedSemesters: [...appState.selectedSemesters],
                selectedCourses: {...appState.selectedCourses},
                courseSchedules: {...appState.courseSchedules}
            };
            
            try {
                // Actualizar estado
                appState.selectedSemesters = data.selectedSemesters;
                appState.selectedCourses = data.selectedCourses;
                appState.courseSchedules = data.courseSchedules;
                
                // Actualizar UI
                renderSemesters();
                renderCourses();
                updateCreditsCounter();
                updateCoursesCounter();
                updateCourseSelect();
                renderCurrentConfiguration();
                
                showToast(`Configuración importada: ${data.metadata?.totalCourses || Object.keys(data.selectedCourses).length} cursos`);
                
            } catch (updateError) {
                // Restaurar estado anterior si hay error
                Object.assign(appState, prevState);
                throw new Error('Error al actualizar la interfaz');
            }
            
        } catch (error) {
            console.error('Error al importar:', error);
            showToast('Error al importar: ' + error.message, 'error');
        }
    };
    
    input.click();
}
