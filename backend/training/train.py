import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from models.gesture_model import GestureRecognitionModel, GestureDataset
from utils.preprocessing import load_dataset, augment_data
import numpy as np
from sklearn.model_selection import train_test_split
import logging
from config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def train_model(
    model,
    train_loader,
    val_loader,
    criterion,
    optimizer,
    num_epochs=50,
    device="cuda"
):
    best_val_loss = float('inf')
    
    for epoch in range(num_epochs):
        # Training phase
        model.train()
        train_loss = 0
        train_correct = 0
        train_total = 0
        
        for batch_idx, (data, target) in enumerate(train_loader):
            data, target = data.to(device), target.to(device)
            
            optimizer.zero_grad()
            outputs = model(data)
            loss = criterion(outputs, target)
            
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            _, predicted = outputs.max(1)
            train_total += target.size(0)
            train_correct += predicted.eq(target).sum().item()
            
        train_loss = train_loss / len(train_loader)
        train_acc = 100. * train_correct / train_total
        
        # Validation phase
        model.eval()
        val_loss = 0
        val_correct = 0
        val_total = 0
        
        with torch.no_grad():
            for data, target in val_loader:
                data, target = data.to(device), target.to(device)
                outputs = model(data)
                loss = criterion(outputs, target)
                
                val_loss += loss.item()
                _, predicted = outputs.max(1)
                val_total += target.size(0)
                val_correct += predicted.eq(target).sum().item()
        
        val_loss = val_loss / len(val_loader)
        val_acc = 100. * val_correct / val_total
        
        logger.info(f'Epoch: {epoch+1}/{num_epochs}')
        logger.info(f'Training Loss: {train_loss:.4f}, Accuracy: {train_acc:.2f}%')
        logger.info(f'Validation Loss: {val_loss:.4f}, Accuracy: {val_acc:.2f}%')
        
        # Save best model
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save(model.state_dict(), 'models/best_model.pth')
            logger.info('Model saved!')

def prepare_datasets():
    # Load the NTU Hand Gesture dataset
    ntu_landmarks, ntu_labels = load_dataset("datasets/ntu_hand_gesture")
    
    # Load the HandGest dataset
    handgest_landmarks, handgest_labels = load_dataset("datasets/handgest")
    
    # Combine datasets
    landmarks = np.concatenate([ntu_landmarks, handgest_landmarks])
    labels = np.concatenate([ntu_labels, handgest_labels])
    
    # Augment training data
    aug_landmarks, aug_labels = augment_data(landmarks, labels)
    
    # Split into train and validation sets
    train_landmarks, val_landmarks, train_labels, val_labels = train_test_split(
        aug_landmarks, aug_labels, test_size=0.2, random_state=42
    )
    
    # Create datasets
    train_dataset = GestureDataset(train_landmarks, train_labels)
    val_dataset = GestureDataset(val_landmarks, val_labels)
    
    # Create data loaders
    train_loader = DataLoader(
        train_dataset,
        batch_size=settings.BATCH_SIZE,
        shuffle=True,
        num_workers=4
    )
    val_loader = DataLoader(
        val_dataset,
        batch_size=settings.BATCH_SIZE,
        shuffle=False,
        num_workers=4
    )
    
    return train_loader, val_loader

def main():
    # Set device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Using device: {device}")
    
    # Initialize model
    model = GestureRecognitionModel().to(device)
    
    # Define loss function and optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=settings.LEARNING_RATE)
    
    # Prepare datasets
    train_loader, val_loader = prepare_datasets()
    
    # Train model
    train_model(
        model,
        train_loader,
        val_loader,
        criterion,
        optimizer,
        num_epochs=settings.NUM_EPOCHS,
        device=device
    )

if __name__ == "__main__":
    main()

