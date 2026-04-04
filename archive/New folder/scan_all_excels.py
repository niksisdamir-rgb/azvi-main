import os
import pandas as pd

def scan():
    files = [f for f in os.listdir('.') if f.endswith('.xlsx')]
    for f in files:
        print(f"\nFILE: {f}")
        try:
            xl = pd.ExcelFile(f)
            for sheet in xl.sheet_names:
                print(f"  SHEET: {sheet}")
                df = xl.parse(sheet, nrows=5)
                print(f"    COLUMNS: {df.columns.tolist()}")
                # Check for August 2024 in any cell
                if '2024' in str(df.values) or 'Avgust' in str(df.values) or 'AVGUST' in str(df.values):
                    print("    [!] Potential August 2024 data detected.")
        except Exception as e:
            print(f"    Error: {e}")

if __name__ == '__main__':
    scan()
