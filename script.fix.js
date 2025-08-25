// ... (código anterior sin cambios)

/**
 * Convierte una hora (HH:MM) a minutos desde el inicio del día
 */
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Convierte una hora (HH:MM) al índice del slot correspondiente.
 * @param {string} horaStr - Hora en formato "HH:MM"
 * @returns {number|null} Índice del slot o null si no se encuentra
 * 
 * Comportamiento:
 * - Si hora === slot.start -> devuelve índice de ese slot
 * - Si slot.start < hora <= slot.end -> devuelve índice (INCLUSIVO en límite final)
 * - Si no mapea -> devuelve null y loguea warning
 */
function horaAIndex(horaStr) {
    if (!horaStr || typeof horaStr !== 'string') {
        console.warn('horaAIndex: hora inválida ->', horaStr);
        return null;
    }

    try {
        const t = timeToMinutes(horaStr);
        if (isNaN(t)) {
            console.warn('horaAIndex: formato inválido ->', horaStr);
            return null;
        }

        for (let i = 0; i < TIME_SLOTS.length; i++) {
            const s = timeToMinutes(TIME_SLOTS[i].start);
            const e = timeToMinutes(TIME_SLOTS[i].end);
            
            if (t === s) return i; // Coincidencia exacta con inicio
            if (t > s && t <= e) return i; // INCLUSIVO en límite superior
        }
        
        console.warn('horaAIndex: hora fuera de TIME_SLOTS ->', horaStr);
        return null;
    } catch (error) {
        console.warn('horaAIndex: error al procesar hora ->', horaStr, error);
        return null;
    }
}

// Wrapper para mantener compatibilidad con código existente
function getTimeSlotIndex(time) {
    const index = horaAIndex(time);
    return index !== null ? index : -1;
}

// ... (resto del código con cambios aplicados)

/**
 * Función de debug expuesta globalmente
 */
function debugState() {
    const debug = {
        selectedCourses: {
            count: Object.keys(appState.selectedCourses).length,
            courses: Object.fromEntries(
                Object.entries(appState.selectedCourses).map(([code, info]) => [
                    code,
                    {
                        nombre: info.nombre,
                        creditos: info.creditos
                    }
                ])
            )
        },
        courseSchedules: {
            count: Object.keys(appState.courseSchedules).length,
            coursesWithSchedules: Object.fromEntries(
                Object.entries(appState.courseSchedules).map(([code, groups]) => [
                    code,
                    {
                        groupCount: Object.keys(groups).length,
                        totalSchedules: Object.values(groups).reduce(
                            (sum, g) => sum + (g.schedules?.length || 0), 0
                        ),
                        validSchedules: Object.values(groups).reduce(
                            (sum, g) => sum + (g.schedules?.filter(s => 
                                horaAIndex(s.start) !== null && 
                                horaAIndex(s.end) !== null &&
                                DAYS.includes(s.day)
                            ).length || 0), 0
                        )
                    }
                ])
            )
        },
        combinations: {
            count: appState.generatedCombinations.length,
            currentPreview: appState.currentPreview ? {
                index: appState.currentPreview.index,
                courseCount: appState.currentPreview.combination.length
            } : null
        }
    };

    console.log('=== Estado de la Aplicación ===');
    console.table(debug.selectedCourses.courses);
    console.log('Cursos seleccionados:', debug.selectedCourses.count);
    console.log('Cursos con horarios:', debug.courseSchedules.count);
    console.log('Combinaciones generadas:', debug.combinations.count);
    
    return debug;
}

// Exponer para uso en consola
window.debugState = debugState;

// Validación mejorada antes de generar combinaciones
function validateBeforeGenerate() {
    const coursesWithoutSchedules = [];
    const coursesWithEmptySchedules = [];
    const coursesWithInvalidSchedules = [];
    
    Object.entries(appState.selectedCourses).forEach(([code, info]) => {
        // Verificar si tiene configuración de horarios
        if (!appState.courseSchedules[code]) {
            coursesWithoutSchedules.push(info.nombre);
            return;
        }
        
        const groups = appState.courseSchedules[code];
        // Verificar si tiene grupos
        if (Object.keys(groups).length === 0) {
            coursesWithEmptySchedules.push(info.nombre);
            return;
        }
        
        // Verificar que al menos un grupo tenga horarios válidos
        const hasValidSchedule = Object.values(groups).some(group => {
            return group.schedules && group.schedules.length > 0 &&
                   group.schedules.every(schedule => {
                       const startIdx = horaAIndex(schedule.start);
                       const endIdx = horaAIndex(schedule.end);
                       return startIdx !== null && endIdx !== null && 
                              endIdx >= startIdx && // Validar orden
                              DAYS.includes(schedule.day);
                   });
        });
        
        if (!hasValidSchedule) {
            coursesWithInvalidSchedules.push(info.nombre);
        }
    });
    
    const problemCourses = [
        ...coursesWithoutSchedules,
        ...coursesWithEmptySchedules,
        ...coursesWithInvalidSchedules
    ];
    
    if (problemCourses.length > 0) {
        showToast('Los siguientes cursos no tienen horarios válidos:\n' + 
                 problemCourses.join(', '), 'error');
        console.warn('Cursos con problemas:', {
            sinHorarios: coursesWithoutSchedules,
            sinGrupos: coursesWithEmptySchedules,
            horariosInvalidos: coursesWithInvalidSchedules
        });
        return false;
    }
    
    return true;
}

// Actualizar función principal de generación
function generateSchedules() {
    // Validar que hay cursos seleccionados
    if (Object.keys(appState.selectedCourses).length === 0) {
        showToast('Primero debes seleccionar cursos', 'warning');
        return;
    }
    
    // Validar horarios antes de generar
    if (!validateBeforeGenerate()) {
        return;
    }
    
    showToast('Generando combinaciones...', 'warning');
    
    try {
        // Generar todas las combinaciones válidas
        const combinations = generateValidCombinations();
        appState.generatedCombinations = combinations;
        
        if (combinations.length === 0) {
            showToast('No se encontraron combinaciones válidas sin choques de horario', 'warning');
            renderCombinationsList();
            return;
        }
        
        renderCombinationsList();
        showToast(`Se encontraron ${combinations.length} combinaciones válidas`);
        
        // Log para debugging
        debugState();
        
    } catch (error) {
        console.error('Error al generar combinaciones:', error);
        showToast('Error al generar combinaciones: ' + error.message, 'error');
    }
}
