import pandas as pd
import os

def inspect(fn, s, skip):
    try:
        print(f"\n--- {fn} [{s}] skip={skip} ---")
        df = pd.read_excel(fn, sheet_name=s, skiprows=skip)
        print("Columns found (first 10):", df.columns.tolist()[:10])
        print("First 5 rows of data:")
        print(df.head(5).to_string())
    except Exception as e:
        print(f"Error inspecting {fn}: {e}")

if __name__ == "__main__":
    inspect('DIZEL TABELA.xlsx', 'ORIGINAL', 3)
    inspect('Utrošak ulja po mašinama za mesec Avgust  VIII.xlsx', 0, 6)
