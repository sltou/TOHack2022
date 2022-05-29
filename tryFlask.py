from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

@app.route('/')
def index():
   return render_template('index.html')

#Create the receiver API POST endpoint:
@app.route("/receiver", methods=["POST"])
def postME():
   data = request.get_json()
   data = jsonify(data)
   return data