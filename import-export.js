// Funciones de importación/exportación
function exportarConfiguracion() {
    try {
        const jsonStr = appState.exportToJson();
        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `horario_${timestamp}.json`;
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showToast('Configuración exportada exitosamente');
        
    } catch (error) {
        console.error('Error al exportar:', error);
        showToast('Error al exportar: ' + error.message, 'error');
    }
}

async function importarConfiguracion() {
    try {
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
                
                // Intentar importar y actualizar el estado
                await appState.importFromJson(text);
                
                // Actualizar la interfaz
                renderSemesters();
                renderCourses();
                updateCreditsCounter();
                updateCoursesCounter();
                updateCourseSelect();
                renderCurrentConfiguration();
                
                const coursesCount = Object.keys(appState.selectedCourses).length;
                const creditsCount = Object.values(appState.selectedCourses)
                    .reduce((sum, course) => sum + course.creditos, 0);
                
                showToast(`Configuración importada: ${coursesCount} cursos, ${creditsCount} créditos`);
                
            } catch (error) {
                console.error('Error al importar:', error);
                showToast('Error al importar: ' + error.message, 'error');
            }
        };
        
        input.click();
        
    } catch (error) {
        console.error('Error al abrir selector de archivos:', error);
        showToast('Error al abrir el selector de archivos', 'error');
    }
}

// Exportar a PDF
async function exportSelectedPDF() {
    try {
        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
            throw new Error('La librería jsPDF no está disponible');
        }
        
        const element = document.querySelector('.schedule-preview');
        if (!element) {
            throw new Error('No se encontró el horario para exportar');
        }
        
        // Crear PDF
        const pdf = new jsPDF('l', 'mm', 'a4');
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const aspectRatio = canvas.width / canvas.height;
        
        let imgWidth = pdfWidth;
        let imgHeight = pdfWidth / aspectRatio;
        
        // Ajustar si la imagen es más alta que la página
        if (imgHeight > pdfHeight) {
            imgHeight = pdfHeight;
            imgWidth = pdfHeight * aspectRatio;
        }
        
        // Centrar la imagen
        const x = (pdfWidth - imgWidth) / 2;
        const y = (pdfHeight - imgHeight) / 2;
        
        pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);
        pdf.save('horario.pdf');
        
        showToast('Horario exportado como PDF');
        
    } catch (error) {
        console.error('Error al exportar PDF:', error);
        showToast('Error al exportar PDF: ' + error.message, 'error');
    }
}

// Exportar a PNG
async function exportSelectedPNG() {
    try {
        const element = document.querySelector('.schedule-preview');
        if (!element) {
            throw new Error('No se encontró el horario para exportar');
        }
        
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });
        
        const link = document.createElement('a');
        link.download = 'horario.png';
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('Horario exportado como PNG');
        
    } catch (error) {
        console.error('Error al exportar PNG:', error);
        showToast('Error al exportar PNG: ' + error.message, 'error');
    }
}
