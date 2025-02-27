from fastapi import FastAPI, UploadFile, File, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from gesture_model import detect_gesture
from presentation import PresentationController
import cv2
import numpy as np
from io import BytesIO
import base64
import json

app = FastAPI(title="Hand Gesture Presentation Viewer API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global presentation controller (load once at startup)
controller = None

# Canvas for drawing
canvas = None
last_x, last_y = None, None
brush_color = (0, 255, 0)  # Default green
brush_size = 5

@app.on_event("startup")
async def startup_event():
    global controller
    controller = PresentationController("sample_presentation.pptx")
    print("Presentation loaded.")

@app.post("/upload-presentation/")
async def upload_presentation(file: UploadFile = File(...)):
    """Upload a new PPT file."""
    global controller
    contents = await file.read()
    with open("uploaded.pptx", "wb") as f:
        f.write(contents)
    controller = PresentationController("uploaded.pptx")
    return {"message": f"Loaded presentation with {controller.total_slides} slides"}

@app.websocket("/ws/gesture_control/{presentation_id}")
async def websocket_endpoint(websocket: WebSocket, presentation_id: str):
    await websocket.accept()
    try:
        while True:
            # Receive the frame as bytes
            frame_data = await websocket.receive_bytes()
            
            # Convert bytes to numpy array
            nparray = np.frombuffer(frame_data, np.uint8)
            frame = cv2.imdecode(nparray, cv2.IMREAD_COLOR)
            
            if frame is None:
                continue
            
            # Detect gesture
            action, coords = detect_gesture(frame)
            
            # Handle actions
            gesture_response = {"gesture": "none"}
            
            if action == "next_slide":
                controller.next_slide()
                gesture_response["gesture"] = "next"
            elif action == "prev_slide":
                controller.prev_slide()
                gesture_response["gesture"] = "previous"
            elif action == "draw" and coords:
                gesture_response["gesture"] = "draw"
                gesture_response["coordinates"] = coords
            elif action == "erase":
                gesture_response["gesture"] = "erase"
            
            # Send the gesture response back to the client
            await websocket.send_json(gesture_response)
            
    except WebSocketDisconnect:
        print(f"Client disconnected for presentation {presentation_id}")
    except Exception as e:
        print(f"Error: {e}")
        await websocket.close()

@app.get("/save-slide/")
async def save_slide():
    """Save the current slide with annotations."""
    if canvas is None:
        return {"message": "No annotations to save"}
    filename = f"slide_{controller.get_current_slide()}_annotated.png"
    cv2.imwrite(filename, canvas)
    return {"message": f"Saved as {filename}"}

# Run with: uvicorn app:app --reload
