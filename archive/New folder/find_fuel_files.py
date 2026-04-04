import os
import pandas as pd

def find_fuel_data():
    files = [f for f in os.listdir('.') if f.endswith('.xlsx')]
    keywords = ['goriva', 'dizel', 'august', 'avgust']
    targets = [f for f in files if any(kw in f.lower() for kw in keywords)]
    
    print(f"Found {len(targets)} potential files.")
    
    for f in targets:
        print(f"\n--- Checking File: {f} ---")
        try:
            # Try to peek at the columns
            xl = pd.ExcelFile(f)
            for sheet in xl.sheet_names:
                print(f"  Sheet: {sheet}")
                df = xl.parse(sheet, nrows=10)
                print(df.columns.tolist())
                # Check for OTP or Quantity/Litr
                cols = [str(c).lower() for c in df.columns]
                if any('otp' in c or 'plate' in c for c in cols) and any('lit' in c or 'quan' in c for c in cols):
                    print(f"  [FOUND!] Sheet '{sheet}' looks like a fuel log.")
        except Exception as e:
            print(f"  Error reading {f}: {e}")

if __name__ == '__main__':
    find_fuel_data()
