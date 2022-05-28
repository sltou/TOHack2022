import os
import AssemblyAIutils as utils


def audio2text(audio_file, api_key, local = True):
    """convert audio into text using the AssemblyAI API"""
    if api_key is None:
        api_key = os.getenv("AAI_API_KEY")
        if api_key is None:
            raise RuntimeError("AAI_API_KEY environment variable not set. Try setting it now, or passing in your "
                               "API key as a command line argument with `--api_key`.")

    # Create header with authorization along with content-type
    header = {
        'authorization': api_key,
        'content-type': 'application/json'
    }

    if local:
        # Upload the audio file to AssemblyAI
        upload_url = utils.upload_file(audio_file, header)
    else:
        upload_url = {'upload_url': audio_file}

    # Request a transcription
    transcript_response = utils.request_transcript(upload_url, header)

    # Create a polling endpoint that will let us check when the transcription is complete
    polling_endpoint = utils.make_polling_endpoint(transcript_response)

    # Wait until the transcription is complete
    utils.wait_for_completion(polling_endpoint, header)

    # Request the paragraphs of the transcript
    paragraphs = utils.get_paragraphs(polling_endpoint, header)

    # Put entire transcript into a string
    text = ""
    for para in paragraphs:
        text = text + para['text'] + '\n'
        
    return text
