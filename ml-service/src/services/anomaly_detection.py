import pandas as pd
import numpy as np
from typing import List, Dict, Any

class AnomalyDetector:
    def __init__(self):
        # We can implement simple Z-score or IQR techniques
        pass
        
    def detect_outliers_zscore(self, data: pd.DataFrame, column: str, threshold: float = 3.0) -> pd.DataFrame:
        """
        Detect anomalies using the Z-score method.
        Requires numerical data in the target column.
        """
        if data.empty or column not in data.columns:
            return pd.DataFrame()
            
        z_scores = np.abs((data[column] - data[column].mean()) / data[column].std())
        outliers = data[z_scores > threshold]
        
        return outliers
