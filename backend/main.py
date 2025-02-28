from fastapi import FastAPI, UploadFile, File, HTTPException, WebSocket, WebSocketDisconnect, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from gesture_model import detect_gesture, GESTURE_ACTIONS
from presentation import PresentationController
import cv2
import numpy as np
from io import BytesIO
import base64
import json
import time
import asyncio
import os
from starlette.websockets import WebSocketState
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("gesture_service")

app = FastAPI(title="Hand Gesture Presentation Viewer API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
controller = None
canvas = None
last_x, last_y = None, None
brush_color = (0, 255, 0)  # Default green
brush_size = 5
current_mode = "presentation"  # Default mode: presentation or annotation

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
async def root():
    return {"message": "Hand Gesture Presentation API is running"}

@app.post("/upload-presentation/")
async def upload_presentation(file: UploadFile = File(...)):
    """Upload a new presentation file (PDF or PowerPoint)."""
    if not file.filename.endswith(('.pptx', '.ppt', '.pdf')):
        raise HTTPException(status_code=400, detail="Only PowerPoint (.ppt, .pptx) and PDF files are supported")
    
    global controller
    try:
        # Save file with original name
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
        controller = PresentationController(file_path)
        
        file_type = "pdf" if file.filename.lower().endswith('.pdf') else "powerpoint"
        
        return {
            "message": f"Loaded {file_type} presentation with {controller.total_slides} slides",
            "filename": file.filename,
            "slides": controller.total_slides,
            "file_type": file_type
        }
    except Exception as e:
        logger.error(f"Error loading presentation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error loading presentation: {str(e)}")

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict = {}
        self.lock = asyncio.Lock()
        self.stats = {"total_connections": 0, "active_connections": 0}

    async def connect(self, websocket: WebSocket, presentation_id: str):
        await websocket.accept()
        async with self.lock:
            self.active_connections[presentation_id] = websocket
            self.stats["total_connections"] += 1
            self.stats["active_connections"] = len(self.active_connections)
        logger.info(f"New connection established for {presentation_id}. Active connections: {self.stats['active_connections']}")
        
    async def disconnect(self, presentation_id: str):
        async with self.lock:
            if presentation_id in self.active_connections:
                del self.active_connections[presentation_id]
                self.stats["active_connections"] = len(self.active_connections)
                logger.info(f"Connection closed for {presentation_id}. Active connections: {self.stats['active_connections']}")

    async def send_response(self, websocket: WebSocket, message: dict):
        try:
            # Check if websocket is still connected before sending
            if websocket.client_state == WebSocketState.CONNECTED:
                await websocket.send_json(message)
            else:
                logger.warning("Tried to send message to closed websocket")
        except Exception as e:
            logger.error(f"Error sending response: {str(e)}")

manager = ConnectionManager()

@app.websocket("/ws/gesture_control/{presentation_id}")
async def websocket_endpoint(websocket: WebSocket, presentation_id: str):
    connection_active = True
    frame_processing_stats = {"total_frames": 0, "processed_frames": 0, "start_time": time.time()}
    
    try:
        logger.info(f"New connection request for presentation {presentation_id}")
        await manager.connect(websocket, presentation_id)
        logger.info(f"Client connected for presentation {presentation_id}")
        
        # Initial connection - notify client if no presentation loaded
        if controller is None:
            await manager.send_response(websocket, {
                "type": "warning",
                "message": "No presentation loaded - please load a presentation first"
            })
        else:
            # Send initial presentation info
            await manager.send_response(websocket, {
                "type": "initial_info",
                "current_slide": controller.get_current_slide() + 1,
                "total_slides": controller.total_slides,
                "is_ppt": controller.is_ppt
            })
        
        # Initialize frame processing parameters
        frame_interval = 1/15  # Process at 15 FPS maximum
        last_frame_time = 0
        frame_count = 0
        last_fps_time = time.time()
        
        # Heartbeat mechanism
        last_heartbeat = time.time()
        HEARTBEAT_INTERVAL = 5  # Send heartbeat every 5 seconds
        
        # Connection health monitoring
        last_successful_frame = time.time()
        CONNECTION_TIMEOUT = 10  # Consider connection stale after 10 seconds of no frames
        
        while connection_active:
            try:
                current_time = time.time()
                
                # Check for connection timeout
                if current_time - last_successful_frame > CONNECTION_TIMEOUT:
                    logger.warning(f"Connection timeout for {presentation_id} - no frames received for {CONNECTION_TIMEOUT} seconds")
                    await manager.send_response(websocket, {
                        "type": "warning", 
                        "message": "Connection appears to be stale - please refresh"
                    })
                    # Don't break yet, give client a chance to reconnect
                
                # Send heartbeat regularly
                if current_time - last_heartbeat > HEARTBEAT_INTERVAL:
                    await manager.send_response(websocket, {"type": "heartbeat"})
                    last_heartbeat = current_time
                    
                    # Send current processing statistics
                    elapsed_time = current_time - frame_processing_stats["start_time"]
                    if elapsed_time > 0:
                        fps = frame_processing_stats["processed_frames"] / elapsed_time
                        frame_processing_stats["processed_frames"] = 0
                        frame_processing_stats["start_time"] = current_time
                        
                        await manager.send_response(websocket, {
                            "type": "stats",
                            "fps": round(fps, 1),
                            "total_frames": frame_processing_stats["total_frames"]
                        })
                
                # Throttle frame processing
                if current_time - last_frame_time < frame_interval:
                    await asyncio.sleep(0.01)  # Small sleep to prevent CPU spinning
                    continue
                
                last_frame_time = current_time
                
                # Use a shorter timeout for receiving messages
                try:
                    data = await asyncio.wait_for(
                        websocket.receive(),
                        timeout=1.0
                    )
                except asyncio.TimeoutError:
                    # Just continue the loop, no need to respond
                    continue
                
                # Handle different message types
                if "text" in data:
                    # Text message handling
                    if data["text"] == "ping":
                        await websocket.send_text("pong")
                        continue
                    elif data["text"] == "pong":
                        # Reset heartbeat timer
                        last_heartbeat = current_time
                        continue
                    elif data["text"].startswith("{"):
                        # Handle JSON messages
                        try:
                            msg_data = json.loads(data["text"])
                            if msg_data.get("type") == "hello":
                                # Client identification
                                logger.info(f"Client identified: {msg_data.get('client', 'unknown')}")
                                continue
                        except json.JSONDecodeError:
                            # Not valid JSON, ignore
                            pass
                
                # Process binary frame data if present
                if "bytes" not in data:
                    logger.debug(f"Received non-binary data: {data}")
                    continue
                
                frame_data = data["bytes"]
                frame_processing_stats["total_frames"] += 1
                
                # Check data is not empty
                if not frame_data or len(frame_data) < 1000:  # Minimum size for a valid image
                    continue
                
                # Reset connection timeout since we received a frame
                last_successful_frame = current_time
                
                # Process frame data
                try:
                    # Convert bytes to numpy array
                    nparray = np.frombuffer(frame_data, np.uint8)
                    frame = cv2.imdecode(nparray, cv2.IMREAD_COLOR)
                    
                    # Skip empty or invalid frames
                    if frame is None or frame.size == 0 or frame.shape[0] < 10 or frame.shape[1] < 10:
                        continue
                    
                    # Detect gesture
                    action, coords, viz_frame = detect_gesture(frame)
                    frame_processing_stats["processed_frames"] += 1
                    
                    # Calculate FPS
                    frame_count += 1
                    fps = 0
                    if current_time - last_fps_time >= 1.0:
                        fps = frame_count / (current_time - last_fps_time)
                        frame_count = 0
                        last_fps_time = current_time
                    
                    # Prepare response
                    gesture_response = {
                        "gesture": "none",
                        "type": "gesture",
                        "fps": round(fps, 1)
                    }
                    
                    # Handle actions based on current mode
                    if current_mode == "presentation" and controller is not None:
                        # Presentation control gestures
                        if action == "next_slide":
                            result = controller.next_slide()
                            gesture_response["gesture"] = "next"
                            gesture_response["message"] = result
                        elif action == "prev_slide":
                            result = controller.prev_slide()
                            gesture_response["gesture"] = "previous"
                            gesture_response["message"] = result
                        elif action == "firstSlide":
                            result = controller.first_slide()
                            gesture_response["gesture"] = "first"
                            gesture_response["message"] = result
                        elif action == "lastSlide":
                            result = controller.last_slide()
                            gesture_response["gesture"] = "last"
                            gesture_response["message"] = result
                        elif action == "stop":
                            result = controller.stop()
                            gesture_response["gesture"] = "stop"
                            gesture_response["message"] = result
                    
                    # These gestures work in both modes
                    if action == "draw":
                        gesture_response["gesture"] = "draw"
                        if coords:
                            gesture_response["coordinates"] = coords
                        # Switch to annotation mode if not already
                        if current_mode != "annotation":
                            current_mode = "annotation"
                            gesture_response["mode"] = current_mode
                    elif action == "pointer":
                        gesture_response["gesture"] = "pointer"
                        if coords:
                            gesture_response["coordinates"] = coords
                        # Switch to presentation mode if not already
                        if current_mode != "presentation":
                            current_mode = "presentation"
                            gesture_response["mode"] = current_mode
                    # Handle other gestures
                    elif action in GESTURE_ACTIONS.values():
                        gesture_response["gesture"] = action
                    
                    # Only encode the visualization frame if there's an actual gesture
                    if action != "none" and action is not None:
                        # Encode the visualization frame at lower quality for performance
                        _, buffer = cv2.imencode('.jpg', viz_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 60])
                        viz_base64 = base64.b64encode(buffer).decode('utf-8')
                        gesture_response["viz_frame"] = viz_base64
                    
                    # Add current mode to response
                    gesture_response["current_mode"] = current_mode
                    
                    # Send the gesture response
                    await manager.send_response(websocket, gesture_response)
                    
                except Exception as frame_error:
                    logger.error(f"Error processing frame: {frame_error}")
                    # Don't send error message to avoid cascade failures
                    
            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected for presentation {presentation_id}")
                connection_active = False
            except Exception as e:
                logger.error(f"WebSocket error: {str(e)}")
                if "Connection closed" in str(e) or "state" in str(e) or "not connected" in str(e):
                    connection_active = False
                
    except Exception as e:
        logger.error(f"Error in WebSocket connection: {str(e)}")
    finally:
        await manager.disconnect(presentation_id)

@app.post("/save-slide/")
async def save_slide(annotations: dict = None):
    """Save the current slide with annotations."""
    if canvas is None:
        return {"message": "No annotations to save"}
        
    # Create save directory with timestamp
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    save_dir = f"saved_slides/{timestamp}"
    os.makedirs(save_dir, exist_ok=True)
    
    # Save the base slide
    base_filename = f"{save_dir}/slide_{controller.get_current_slide()}_base.png"
    cv2.imwrite(base_filename, canvas)
    
    # Save annotations if provided
    result = {
        "base_image": base_filename,
        "annotations": [],
        "timestamp": timestamp
    }
    
    if annotations:
        annotation_file = f"{save_dir}/annotations.json"
        with open(annotation_file, "w") as f:
            json.dump(annotations, f)
        result["annotations"] = annotation_file
        
        # Render annotations on a separate layer
        if "strokes" in annotations:
            annotation_layer = np.zeros_like(canvas)
            for stroke in annotations["strokes"]:
                points = np.array(stroke["points"], dtype=np.int32)
                color = tuple(map(int, stroke.get("color", (0, 255, 0))))
                thickness = stroke.get("thickness", 2)
                cv2.polylines(annotation_layer, [points], False, color, thickness)
            
            # Save annotation layer
            annotation_image = f"{save_dir}/slide_{controller.get_current_slide()}_annotations.png"
            cv2.imwrite(annotation_image, annotation_layer)
            result["annotation_layer"] = annotation_image
            
            # Save combined image
            combined = cv2.addWeighted(canvas, 1, annotation_layer, 0.7, 0)
            combined_filename = f"{save_dir}/slide_{controller.get_current_slide()}_combined.png"
            cv2.imwrite(combined_filename, combined)
            result["combined_image"] = combined_filename
    
    return result

@app.post("/change-mode/{mode}")
async def change_mode(mode: str, settings: dict = None):
    """Change the current operation mode with optional settings."""
    global current_mode, brush_color, brush_size
    
    if mode not in ["presentation", "annotation"]:
        raise HTTPException(status_code=400, detail="Invalid mode. Use 'presentation' or 'annotation'")
    
    current_mode = mode
    mode_settings = {"changed_at": time.time()}
    
    if settings:
        if "brush_color" in settings:
            try:
                r, g, b = settings["brush_color"]
                brush_color = (int(r), int(g), int(b))
                mode_settings["brush_color"] = brush_color
            except (ValueError, TypeError):
                raise HTTPException(status_code=400, detail="Invalid brush color format. Use [R,G,B]")
                
        if "brush_size" in settings:
            try:
                new_size = int(settings["brush_size"])
                if 1 <= new_size <= 50:
                    brush_size = new_size
                    mode_settings["brush_size"] = brush_size
                else:
                    raise HTTPException(status_code=400, detail="Brush size must be between 1 and 50")
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid brush size")
    
    return {
        "message": f"Mode changed to {mode}",
        "current_mode": current_mode,
        "settings": mode_settings
    }

@app.get("/current-status/")
async def get_status():
    """Get detailed presentation status and mode."""
    status = {
        "status": "no_presentation" if controller is None else "active",
        "mode": current_mode,
        "connection_stats": manager.stats,
        "timestamp": time.time(),
        "settings": {
            "brush_color": brush_color,
            "brush_size": brush_size
        }
    }
    
    if controller is not None:
        status.update({
            "presentation": {
                "total_slides": controller.total_slides,
                "current_slide": controller.get_current_slide() + 1,
                "is_first_slide": controller.get_current_slide() == 0,
                "is_last_slide": controller.get_current_slide() == controller.total_slides - 1
            }
        })
        
        # Check for saved slides
        saved_slides_dir = "saved_slides"
        if os.path.exists(saved_slides_dir):
            saved_slides = []
            for timestamp_dir in sorted(os.listdir(saved_slides_dir), reverse=True):
                dir_path = os.path.join(saved_slides_dir, timestamp_dir)
                if os.path.isdir(dir_path):
                    slides = [f for f in os.listdir(dir_path) if f.endswith(('.png', '.json'))]
                    if slides:
                        saved_slides.append({
                            "timestamp": timestamp_dir,
                            "files": slides,
                            "path": dir_path
                        })
            status["saved_slides"] = saved_slides[:5]  # Return last 5 saves
            
    return status

@app.get("/current-slide-image/")
async def get_current_slide_image():
    """Get the current slide as an image."""
    if controller is None:
        raise HTTPException(status_code=404, detail="No presentation loaded")
    
    image_path = controller.get_current_slide_image()
    if not image_path or not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Slide image not found")
    
    return FileResponse(image_path)

@app.get("/health/")
async def health_check():
    """API health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "connections": manager.stats
    }

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Gesture Recognition Service")
    uvicorn.run(app, host="0.0.0.0", port=8000)
