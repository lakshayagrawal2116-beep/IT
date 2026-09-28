import os
import glob
import kagglehub
import pandas as pd

# Download latest version of dataset
print("Downloading dataset from Kaggle...")
path = kagglehub.dataset_download("suraj520/customer-support-ticket-dataset")
print("Dataset downloaded to:", path)

# Find CSV files in the downloaded directory
csv_files = glob.glob(os.path.join(path, "*.csv"))
print("Found CSV files:", csv_files)

if csv_files:
    df = pd.read_csv(csv_files[0])
    print("\nDataset successfully loaded!")
    print(f"Shape: {df.shape}")
    print("\nColumns:", df.columns.tolist())
    print("\nFirst 5 records:")
    print(df.head())
    
    # Save a copy locally in data/it_tickets.csv
    os.makedirs("data", exist_ok=True)
    local_csv_path = os.path.join("data", "it_tickets.csv")
    df.to_csv(local_csv_path, index=False)
    print(f"\nSaved local copy to: {local_csv_path}")
else:
    print("No CSV file found in downloaded path.")