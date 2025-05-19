from flask import Flask, render_template, request, jsonify
import speech_recognition as sr
import io
import logging
from pydub import AudioSegment

app = Flask(__name__)

# Configurar logging para depuración
logging.basicConfig(level=logging.DEBUG)

# Lista para almacenar los nombres reconocidos
names = []

def recognize_speech(audio_data):
    recognizer = sr.Recognizer()
    
    logging.debug(f"Recibido audio de longitud: {len(audio_data)} bytes")
    
    try:
        # Convertir audio WebM a WAV usando pydub
        audio = AudioSegment.from_file(io.BytesIO(audio_data), format="webm")
        wav_io = io.BytesIO()
        audio.export(wav_io, format="wav")
        wav_io.seek(0)
        
        # Usar el audio WAV con SpeechRecognition
        audio_file = sr.AudioFile(wav_io)
        with audio_file as source:
            audio_data = recognizer.record(source)
        
        # Reconocer el texto usando Google Speech Recognition
        text = recognizer.recognize_google(audio_data, language='es-ES')
        logging.debug(f"Texto reconocido: {text}")
        return {"status": "success", "text": text}
    except sr.UnknownValueError:
        logging.warning("No se pudo entender el audio")
        return {"status": "error", "text": "No se pudo entender el audio"}
    except sr.RequestError as e:
        logging.error(f"Error en la solicitud: {e}")
        return {"status": "error", "text": f"Error en la solicitud: {e}"}
    except Exception as e:
        logging.error(f"Error procesando el audio: {e}")
        return {"status": "error", "text": f"Error procesando el audio: {e}"}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/recognize', methods=['POST'])
def recognize():
    if 'audio' not in request.files:
        logging.error("No se recibió audio")
        return jsonify({'status': 'error', 'text': 'No se recibió audio'}), 400
    
    audio_file = request.files['audio']
    audio_data = audio_file.read()
    
    # Procesar el audio
    result = recognize_speech(audio_data)
    
    # Agregar el nombre reconocido a la lista si es exitoso
    if result['status'] == 'success':
        names.append(result['text'])
    
    return jsonify({'status': result['status'], 'text': result['text'], 'names': names})

@app.route('/get_names', methods=['GET'])
def get_names():
    return jsonify({'names': names})

if __name__ == '__main__':
    app.run(debug=True)