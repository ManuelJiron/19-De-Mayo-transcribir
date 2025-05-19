let mediaRecorder;
let audioChunks = [];

document.getElementById('recordButton').addEventListener('click', async () => {
    const button = document.getElementById('recordButton');
    
    if (button.textContent === 'Hablar') {
        // Iniciar grabación
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            
            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
                console.log('Datos de audio recibidos:', event.data);
            };
            
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                console.log('Audio blob creado:', audioBlob);
                
                const formData = new FormData();
                formData.append('audio', audioBlob, 'recording.webm');
                
                // Enviar audio al servidor
                const response = await fetch('/recognize', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                console.log('Respuesta del servidor:', result);
                
                // Mostrar el texto reconocido
                const statusDiv = document.getElementById('status');
                statusDiv.textContent = result.text;
                if (result.status === 'error') {
                    statusDiv.style.color = 'red';
                } else {
                    statusDiv.style.color = 'green';
                    updateRow(result.names);
                }
                
                // Limpiar para la próxima grabación
                audioChunks = [];
            };
            
            mediaRecorder.start();
            button.textContent = 'Detener';
            button.classList.add('recording');
            document.getElementById('status').textContent = 'Grabando...';
        } catch (err) {
            console.error('Error accediendo al micrófono:', err);
            document.getElementById('status').textContent = 'Error: No se pudo acceder al micrófono';
            document.getElementById('status').style.color = 'red';
        }
    } else {
        // Detener grabación
        mediaRecorder.stop();
        button.textContent = 'Hablar';
        button.classList.remove('recording');
    }
});

// Función para actualizar la fila con los nombres
function updateRow(names) {
    const namesRow = document.getElementById('namesRow');
    namesRow.innerHTML = ''; // Limpiar fila
    
    names.forEach(name => {
        const nameDiv = document.createElement('div');
        nameDiv.className = 'name';
        nameDiv.textContent = name;
        namesRow.appendChild(nameDiv);
    });
}

// Cargar nombres iniciales al cargar la página
window.onload = async () => {
    const response = await fetch('/get_names');
    const data = await response.json();
    updateRow(data.names);
};