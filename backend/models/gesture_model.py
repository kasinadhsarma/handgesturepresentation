import torch
import torch.nn as nn
import torch.nn.functional as F

class GestureRecognitionModel(nn.Module):
    def __init__(self, input_size=63, hidden_size=128, num_classes=14):
        super(GestureRecognitionModel, self).__init__()
        
        # Input size is 21 landmarks x 3 coordinates (x, y, z)
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=2,
            batch_first=True,
            dropout=0.2
        )
        
        self.attention = nn.MultiheadAttention(
            embed_dim=hidden_size,
            num_heads=8,
            dropout=0.1
        )
        
        self.fc1 = nn.Linear(hidden_size, 64)
        self.dropout = nn.Dropout(0.3)
        self.fc2 = nn.Linear(64, num_classes)
        
    def forward(self, x):
        # x shape: (batch_size, sequence_length, input_size)
        
        # LSTM layer
        lstm_out, _ = self.lstm(x)
        
        # Self-attention layer
        attn_out, _ = self.attention(lstm_out, lstm_out, lstm_out)
        
        # Global average pooling
        pooled = torch.mean(attn_out, dim=1)
        
        # Fully connected layers
        x = F.relu(self.fc1(pooled))
        x = self.dropout(x)
        x = self.fc2(x)
        
        return F.softmax(x, dim=1)

class GestureDataset(torch.utils.data.Dataset):
    def __init__(self, landmarks, labels):
        self.landmarks = torch.FloatTensor(landmarks)
        self.labels = torch.LongTensor(labels)
        
    def __len__(self):
        return len(self.landmarks)
        
    def __getitem__(self, idx):
        return self.landmarks[idx], self.labels[idx]

