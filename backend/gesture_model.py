import os
import cv2
import mediapipe as mp
import numpy as np
import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import time

class GestureNet(nn.Module):
    def __init__(self):
        super(GestureNet, self).__init__()
        self.conv1 = nn.Conv2d(3, 32, 3)
        self.batch_norm1 = nn.BatchNorm2d(32)
        self.conv2 = nn.Conv2d(32, 64, 3)
        self.batch_norm2 = nn.BatchNorm2d(64)
        self.conv3 = nn.Conv2d(64, 128, 3)
        self.batch_norm3 = nn.BatchNorm2d(128)
        self.pool = nn.MaxPool2d(2, 2)
        self.fc1 = nn.Linear(128 * 8 * 8, 512)  # Adjusted input size
        self.fc2 = nn.Linear(512, 20)  # 20 gesture classes
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.5)

    def forward(self, x):
        x = self.pool(self.relu(self.batch_norm1(self.conv1(x))))
        x = self.pool(self.relu(self.batch_norm2(self.conv2(x))))
        x = self.pool(self.relu(self.batch_norm3(self.conv3(x))))
        x = x.view(-1, 128 * 8 * 8)  # Adjusted size
        x = self.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.fc2(x)
        return x

# Initialize Mediapipe Hands
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
hands = mp_hands.Hands(max_num_hands=1, min_detection_confidence=0.7)

# Initialize and load the trained CNN model
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = GestureNet().to(device)
MODEL_PATH = "backend/best_cnn_model.pth"

try:
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")
        
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    print("Model loaded successfully")
except Exception as e:
    print(f"Error loading model: {e}")
    # Add error message to all visualizations if model fails to load
    def detect_gesture(frame):
        viz_frame = frame.copy()
        cv2.putText(viz_frame, "Model not loaded - check console", (10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        return "none", None, viz_frame
model.eval()

# Image transformations for model input
transform = transforms.Compose([
    transforms.Resize((64, 64)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Gesture mappings from model predictions to actions based on the dataset
GESTURE_ACTIONS = {
    0: "next_slide",        # Class 0
    1: "prev_slide",        # Class 1 
    2: "firstSlide",        # Class 10 (Label 2)
    3: "lastSlide",         # Class 11 (Label 3)
    4: "stop",              # Class 12 (Label 4)
    5: "save",              # Class 13 (Label 5)
    6: "undo",              # Class 14 (Label 6)
    7: "redo",              # Class 15 (Label 7)
    8: "zoomIn",            # Class 16 (Label 8)
    9: "zoomOut",           # Class 17 (Label 9)
    10: "pointer",          # Class 18 (Label 10)
    11: "draw",             # Class 19 (Label 11)
    12: "erase",            # Class 2 (Label 12)
    13: "highlight",        # Class 3 (Label 13)
    14: "text",             # Class 4 (Label 14)
    15: "pen",              # Class 5 (Label 15)
    16: "shapeCircle",      # Class 6 (Label 16)
    17: "shapeRect",        # Class 7 (Label 17)
    18: "shapeLine",        # Class 8 (Label 18)
    19: "none"              # Class 9 (Label 19)
}

def process_hand_region(frame, hand_landmarks):
    """Extract and process hand region for model input."""
    h, w, _ = frame.shape
    
    # Get hand bounding box
    x_coords = [landmark.x for landmark in hand_landmarks.landmark]
    y_coords = [landmark.y for landmark in hand_landmarks.landmark]
    x_min, x_max = min(x_coords), max(x_coords)
    y_min, y_max = min(y_coords), max(y_coords)
    
    # Add padding
    padding = 0.1
    x_min = max(0, x_min - padding)
    x_max = min(1, x_max + padding)
    y_min = max(0, y_min - padding)
    y_max = min(1, y_max + padding)
    
    # Convert to pixel coordinates
    x_min, x_max = int(x_min * w), int(x_max * w)
    y_min, y_max = int(y_min * h), int(y_max * h)
    
    # Extract hand region
    hand_region = frame[y_min:y_max, x_min:x_max]
    if hand_region.size == 0:
        return None
    
    # Convert to PIL Image and apply transformations
    hand_region = cv2.cvtColor(hand_region, cv2.COLOR_BGR2RGB)
    pil_image = Image.fromarray(hand_region)
    input_tensor = transform(pil_image).unsqueeze(0).to(device)
    
    return input_tensor, (x_min, y_min, x_max, y_max)

# Initialize frame counter for FPS calculation
frame_count = 0
start_time = time.time()

def detect_gesture(frame):
    """Process a frame and return detected gesture and coordinates (if applicable)."""
    global frame_count, start_time
    
    # Calculate FPS
    frame_count += 1
    elapsed_time = time.time() - start_time
    fps = frame_count / elapsed_time if elapsed_time > 0 else 0
    
    # Reset counter every second
    if elapsed_time > 1:
        frame_count = 0
        start_time = time.time()
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(rgb_frame)
    
    # Create a copy of the frame for visualization
    viz_frame = frame.copy()
    
    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            # Draw hand landmarks for visualization
            mp_drawing.draw_landmarks(
                viz_frame,
                hand_landmarks,
                mp_hands.HAND_CONNECTIONS,
                mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=4),
                mp_drawing.DrawingSpec(color=(0, 0, 255), thickness=2, circle_radius=2)
            )
            
            # Process hand region for model prediction
            input_data = process_hand_region(frame, hand_landmarks)
            if input_data is None:
                continue
            
            input_tensor, bbox = input_data
            
            # Get model prediction
            with torch.no_grad():
                output = model(input_tensor)
                predicted_class = torch.argmax(output, dim=1).item()
                confidence = torch.softmax(output, dim=1)[0][predicted_class].item()
                
            # Map prediction to action
            action = GESTURE_ACTIONS.get(predicted_class, "none")
            
            # Add gesture label to visualization
            cv2.rectangle(viz_frame, (bbox[0], bbox[1]), (bbox[2], bbox[3]), (0, 255, 0), 2)
            cv2.putText(viz_frame, f"{action} ({confidence:.2f})", 
                       (bbox[0], bbox[1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            
            # If drawing or pointer, return coordinates of index finger tip
            if action in ["draw", "pointer"]:
                x = int(hand_landmarks.landmark[8].x * frame.shape[1])
                y = int(hand_landmarks.landmark[8].y * frame.shape[0])
                return action, (x, y), viz_frame
                
            return action, None, viz_frame
            
    # Add status information to visualization
    current_time = time.strftime("%H:%M:%S")
    cv2.putText(viz_frame, "No hand detected", (10, 30), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                
    # Draw semi-transparent background for stats
    overlay = viz_frame.copy()
    cv2.rectangle(overlay, (5, viz_frame.shape[0] - 65, 200, viz_frame.shape[0] - 5), 
                 (0, 0, 0), -1)
    cv2.addWeighted(overlay, 0.5, viz_frame, 0.5, 0, viz_frame)
    
    # Add stats with improved visibility
    cv2.putText(viz_frame, f"FPS: {fps:.1f}", (10, viz_frame.shape[0] - 45), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
    cv2.putText(viz_frame, f"Device: {device}", (10, viz_frame.shape[0] - 25), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    cv2.putText(viz_frame, current_time, (viz_frame.shape[1] - 70, 20),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    return "none", None, viz_frame

# For direct testing of the gesture detection
if __name__ == "__main__":
    cap = cv2.VideoCapture(0)
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame")
            break
            
        # Process the frame
        action, coords, viz_frame = detect_gesture(frame)
        
        # Display the action
        cv2.putText(viz_frame, f"Gesture: {action}", (10, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                   
        # Show the frame
        cv2.imshow('Hand Gesture Detection', viz_frame)
        
        # Exit on ESC
        if cv2.waitKey(1) == 27:
            break
            
    cap.release()
    cv2.destroyAllWindows()
