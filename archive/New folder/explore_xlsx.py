import pandas as pd
import os

def explore_diesel():
    filepath = 'DIZEL TABELA.xlsx'
    try:
        xls = pd.ExcelFile(filepath)
        print(f"File: {filepath}")
        print(f"Sheets: {xls.sheet_names}")
        
        for sheet in xls.sheet_names:
            print(f"\n--- Exploring Sheet: {sheet} ---")
            # Read first 50 rows to find header/data
            df = pd.read_excel(filepath, sheet_name=sheet, nrows=50)
            print(f"Shape: {df.shape}")
            print("First 15 rows:")
            print(df.to_string())
            
            # Look for keywords like "Plate" or "Liters" or "L"
            matches = df.astype(str).apply(lambda x: x.str.contains('Plate|Liters|Quantity|AZVIRT', case=False)).any().any()
            if matches:
                print(f"!!! Potential data found in sheet: {sheet}")
                
    except Exception as e:
        print(f"Exploration failed: {e}")

if __name__ == '__main__':
    explore_diesel()
