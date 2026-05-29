import requests
import os
import json

BASE_URL = "http://localhost:8001"
PDF_PATH = r"c:\Users\lenovo\Downloads\AskMyPDF\backend\uploads\GRP-5_MajorProject_Report.pdf"

def test_pipeline():
    print("--- Testing /upload ---")
    if not os.path.exists(PDF_PATH):
        print(f"Error: Test PDF not found at {PDF_PATH}")
        return

    with open(PDF_PATH, "rb") as f:
        files = {"file": (os.path.basename(PDF_PATH), f, "application/pdf")}
        response = requests.post(f"{BASE_URL}/upload", files=files)
    
    if response.status_code != 200:
        print(f"Upload failed: {response.status_code} - {response.text}")
        return

    data = response.json()
    session_id = data["session_id"]
    print(f"Upload success! Session ID: {session_id}")

    print("\n--- Testing /chat (streaming) ---")
    chat_payload = {
        "session_id": session_id,
        "question": "What is the title of this project?",
        "mode": "Beginner"
    }
    
    response = requests.post(f"{BASE_URL}/chat", json=chat_payload, stream=True)
    
    if response.status_code != 200:
        print(f"Chat failed: {response.status_code} - {response.text}")
        return

    print("Streaming response:")
    for line in response.iter_lines():
        if line:
            decoded_line = line.decode('utf-8')
            try:
                msg = json.loads(decoded_line)
                if msg["type"] == "sources":
                    print(f"\n[Sources received: {len(msg['data'])} chunks]")
                elif msg["type"] == "chunk":
                    print(msg["data"], end="", flush=True)
            except json.JSONDecodeError:
                print(f"\nRaw line: {decoded_line}")
    print("\n\nPipeline test complete.")

if __name__ == "__main__":
    test_pipeline()
