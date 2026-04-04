import os
import pandas as pd
from typing import Dict, Any

class DataIngestionService:
    def __init__(self, data_dir: str):
        self.data_dir = data_dir
        
    def scan_directory(self) -> Dict[str, list]:
        """Scans the directory and categorizes files by extension."""
        categories = {'xlsx': [], 'csv': [], 'dbf': [], 'txt': [], 'pdf': []}
        
        for root, dirs, files in os.walk(self.data_dir):
            for file in files:
                ext = file.split('.')[-1].lower()
                if ext in categories:
                    categories[ext].append(os.path.join(root, file))
                    
        return categories

    def load_excel(self, file_path: str) -> pd.DataFrame:
        """Loads an Excel file."""
        try:
            return pd.read_excel(file_path)
        except Exception as e:
            print(f"Failed to load {file_path}: {e}")
            return pd.DataFrame()

    def construct_training_context(self) -> Dict[str, Any]:
        """
        Loads the starter data from the provided archive folder 
        to be used for training / RAG context.
        """
        files_by_ext = self.scan_directory()
        return {
            "excel_files_count": len(files_by_ext['xlsx']),
            "csv_files_count": len(files_by_ext['csv']),
            # More processing logic can be added here
        }

if __name__ == "__main__":
    service = DataIngestionService("/home/k/Downloads/azvirt_dms/archive/New folder")
    stats = service.construct_training_context()
    print("Ingestion Context Stats:", stats)
