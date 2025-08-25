// ... (código existente)

/**
 * Crea la estructura base de la tabla de horario
 */
function createScheduleTable() {
    let html = `
        <div class="schedule-wrapper">
            <table class="schedule-table">
                <thead>
                    <tr>
                        <th class="time-column"></th>
                        ${DAYS.map(day => `<th>${day}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
    `;
    
    TIME_SLOTS.forEach(slot => {
        html += `
            <tr>
                <td class="time-column">${slot.start}<br>${slot.end}</td>
                ${DAYS.map(() => '<td></td>').join('')}
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
            <div class="blocks-overlay"></div>
        </div>
    `;
    
    return html;
}

/**
 * Renderiza un bloque de horario en el overlay
 */
function renderScheduleBlock(data) {
    const startIndex = horaAIndex(data.start);
    const endIndex = horaAIndex(data.end);
    const dayIndex = DAYS.indexOf(data.day);
    
    if (startIndex === null || endIndex === null || dayIndex === -1) {
        console.warn('Horario inválido:', data);
        return;
    }
    
    // Calcular dimensiones (endIndex inclusivo)
    const height = (endIndex - startIndex + 1) * ROW_HEIGHT;
    const top = startIndex * ROW_HEIGHT;
    const width = `${100 / DAYS.length}%`;
    const left = `${(dayIndex * 100) / DAYS.length}%`;
    
    const block = document.createElement('div');
    block.className = `schedule-block ${data.colorClass}`;
    block.style.cssText = `
        left: ${left};
        width: ${width};
        top: ${top}px;
        height: ${height}px;
    `;
    
    block.innerHTML = `
        <div class="course-name">${formatCourseName(data.courseName)}</div>
        <div class="group-info">Grupo ${data.group}</div>
    `;
    
    return block;
}

function renderSchedulePreview(combination, combinationNumber) {
    const container = document.getElementById('schedule-grid');
    container.innerHTML = createScheduleTable();
    
    const overlay = container.querySelector('.blocks-overlay');
    const courseColors = new Map();
    let colorIndex = 0;
    
    combination.forEach(group => {
        if (!courseColors.has(group.courseCode)) {
            courseColors.set(group.courseCode, ++colorIndex);
        }
        
        group.schedules.forEach(schedule => {
            const block = renderScheduleBlock({
                courseName: group.courseName,
                group: group.group,
                day: schedule.day,
                start: schedule.start,
                end: schedule.end,
                colorClass: `color-${courseColors.get(group.courseCode)}`
            });
            
            if (block) overlay.appendChild(block);
        });
    });
    
    // Actualizar información y resumen
    document.getElementById('preview-info').textContent = `Combinación ${combinationNumber}`;
    document.getElementById('schedule-summary').innerHTML = createScheduleSummary(combination);
}
