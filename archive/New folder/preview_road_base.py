import pandas as pd
import os

files = ['Putna Baza/avgust 2025 fiksni rezervoar.xlsx', 'Putna Baza/avgust 2025 mobilna pumpa.xlsx']
for f in files:
    print(f"--- FILE: {f} ---")
    try:
        df = pd.read_excel(f, header=None)
        print(df.head(10))
    except Exception as e:
        print(f"Error reading {f}: {e}")
    print("\n")
