from flask import Flask, render_template, jsonify, request
from audio2text import audio2text
import os

app = Flask(__name__)

@app.route('/')
def index():
   return render_template('index.html')

#Create the receiver API POST endpoint:
@app.route("/receiver", methods=["POST"])
def postME():
   data = request.get_json()
   data = jsonify(data)
   #text = audio2text(data,"410a879f3cd94ea49d44d9f95929f452", local=False)
   return data

# receive audio
@app.route("/audioupload", methods=["POST"])
def postAudio():
   #data = request.form#['audio-file']
   #print(data.get('audio-file'))
   #text = audio2text(data,"410a879f3cd94ea49d44d9f95929f452", local=False)
   #return data
   f = request.files['audio-file']
   with open('file.mp3', 'wb') as audio:
       f.save(audio)
       print('file uploaded successfully')
       f.close()
   if os.path.isfile('./file.mp3'):
       print("./file.mp3 exists, overriding")
   text = audio2text('./file.mp3',"410a879f3cd94ea49d44d9f95929f452")
   return text