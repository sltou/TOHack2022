//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream; 						//stream from getUserMedia()
var recorder; 						//WebAudioRecorder object
var input; 							//MediaStreamAudioSourceNode  we'll be recording
var encodingType; 					//holds selected encoding for resulting audio (file)
var encodeAfterRecord = true;       // when to encode

// shim for AudioContext when it's not avb. 
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext; //new audio context to help us record

var encodingTypeSelect = document.getElementById("encodingTypeSelect");
var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");

// 

//add events to those 2 buttons
recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);

function startRecording() {
	console.log("startRecording() called");

	/*
		Simple constraints object, for more advanced features see
		https://addpipe.com/blog/audio-constraints-getusermedia/
	*/
    
    var constraints = { audio: true, video:false }

    /*
    	We're using the standard promise based getUserMedia() 
    	https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
	*/

	navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
		/*__log("getUserMedia() success, stream created, initializing WebAudioRecorder...");*/

		/*
			create an audio context after getUserMedia is called
			sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
			the sampleRate defaults to the one set in your OS for your playback device

		*/
		audioContext = new AudioContext();

		//update the format 
		document.getElementById("formats").innerHTML="Format: 2 channel "+encodingTypeSelect.options[encodingTypeSelect.selectedIndex].value+" @ "+audioContext.sampleRate/1000+"kHz"

		//assign to gumStream for later use
		gumStream = stream;
		
		/* use the stream */
		input = audioContext.createMediaStreamSource(stream);
		
		//stop the input from playing back through the speakers
		//input.connect(audioContext.destination)

		//get the encoding 
		encodingType = encodingTypeSelect.options[encodingTypeSelect.selectedIndex].value;
		
		//disable the encoding selector
		encodingTypeSelect.disabled = true;

		recorder = new WebAudioRecorder(input, {
		  workerDir: "static/js/", // must end with slash
		  encoding: encodingType,
		  numChannels:2, //2 is the default, mp3 encoding supports only 2
		  onEncoderLoading: function(recorder, encoding) {
		    // show "loading encoder..." display
		    // __log("Loading "+encoding+" encoder...");
		  },
		  onEncoderLoaded: function(recorder, encoding) {
		    // hide "loading encoder..." display
		    // __log(encoding+" encoder loaded");
		  }
		});

		recorder.onComplete = function(recorder, blob) { 
			 //__log("Encoding complete");
			createDownloadLink(blob,recorder.encoding);
			encodingTypeSelect.disabled = false;
		}

		recorder.setOptions({
		  timeLimit:120,
		  encodeAfterRecord:encodeAfterRecord,
	      ogg: {quality: 0.5},
	      mp3: {bitRate: 160}
	    });

		//start the recording process
		recorder.startRecording();

		//  __log("Recording started");

	}).catch(function(err) {
	  	//enable the record button if getUSerMedia() fails
    	recordButton.disabled = false;
    	stopButton.disabled = true;

	});

	//disable the record button
    recordButton.disabled = true;
    stopButton.disabled = false;
}

function stopRecording() {
	console.log("stopRecording() called");
	
	//stop microphone access
	gumStream.getAudioTracks()[0].stop();

	//disable the stop button
	stopButton.disabled = true;
	recordButton.disabled = false;
	
	//tell the recorder to finish the recording (stop recording + encode the recorded audio)
	recorder.finishRecording();

	__log('Recording completed - processing audio...');
}

function createDownloadLink(blob,encoding) {
	
	var url = URL.createObjectURL(blob);
	var au = document.createElement('audio');
	var li = document.createElement('li');
	var link = document.createElement('a');
	var newline = document.createTextNode("\n\n");
	br.innerHTML="<br/>"
	var translatedText;	

	//add controls to the <audio> element
	au.controls = true;
	au.src = url;

	//link the a element to the blob
	link.href = url;
	link.download = 'recordedAudio.'+encoding;
	link.innerHTML = link.download;
	//link.click();

	//upload link to the server
	var xhr = new XMLHttpRequest();
	xhr.onload = function (e, li) {
		if (this.readyState === 4) {
			console.log("Server returned: ", e.target.responseText);
			translatedText = e.target.responseText;
		}
	};
	var fd = new FormData();
	fd.append('audio-file', blob);
	xhr.open("POST", "/audioupload", false);
	xhr.send(fd);
	//console.log(text);
	//add the new audio and a elements to the li element
	li.appendChild(au);
	li.appendChild(newline);
	li.appendChild(link);
	li.appendChild(newline);
	console.log(translatedText);
	var txt = document.createTextNode("\n\n" +translatedText);

	li.appendChild(txt);
	li.appendChild(br);
	//add the li element to the ordered list
	recordingsList.appendChild(li);

	//this is passing a json to python, make it into separate funtion [TODO]
	//var audioLink = recordingsList.childNodes[0].childNodes[2].href;

	// converting audio from binary blob to mp3
	/*var ffmpeg = require('ffmpeg');
	try {
		var process = new ffmpeg('testblob');
		process.then(function (audio) {
			audio.fnExtractSoundToMP3('testmp3.mp3', function (error, file) {
				if (!error)
					console.log('Audio file: ' + file);
			});
		}, function (err) {
			console.log('Error: ' + err);
		});
	}
	catch (e) {
		console.log(e.code);
		console.log(e.msg);
    }*/
	//sendAudioFile(au);
	//console.log(audioLink);
	/*
	fetch("http://127.0.0.1:5000/receiver",
		{
			method: 'POST',
			headers: {
				'Content-type': 'application/json',
				'Accept': 'application/json'
			},
			// Strigify the payload into JSON:
			body: JSON.stringify(audioLink)
		}).then(res => {
			if (res.ok) {
				return res.json()
			} else {
				alert("something is wrong with json")
			}
		}).then(jsonResponse => {

			// Log the response data in the console
			console.log(jsonResponse)
		}
		).catch((err) => console.error(err));*/
}

/*function sendAudio2Python(blob, enconding) {
	recordingsList[-1].
}*/


//helper function
function __log(e, data) {
	log.innerHTML += "\n" + e + " " + (data || '');
}




// UPLOADING AUDIO

const getValuesFromInputs = () =>{
	const audioFile = document.querySelector('input.audio').files[0];
	document.querySelector('form').style.display = 'none';
 
	return [audioFile];
 
 }

 const convertInputValues = () => {
	const [audioFile] = getValuesFromInputs();
  
	const audioFileURL = URL.createObjectURL(audioFile);
  
	return[audioFileURL]
  }

  function createUploadLink(blob,encoding) {
	
	const url = convertInputValues();
	var au = document.createElement('audio');
	var li = document.createElement('li');
	var link = document.createElement('a');
	var br = document.createElement('br')

	//add controls to the <audio> element
	au.controls = true;
	au.src = url;

	//link the a element to the blob
	link.href = url;
	link.download = 'uploadedAudio.'+encoding;
	link.innerHTML = link.download;

	//add the new audio and a elements to the li element
	li.appendChild(au);
	li.appendChild(link);

	//add the li element to the ordered list
	recordingsList.appendChild(li);
}
