import os
import pandas as pd
import glob

def process_dizel_files():
    # Find all files that might contain diesel data
    files = glob.glob("*.xlsx")
    target_keywords = ['dizel', 'goriva', 'avgust', 'august', 'fuel']
    
    for f in files:
        if any(kw in f.lower() for kw in target_keywords):
            print(f"\nProcessing File: {f}")
            try:
                xl = pd.ExcelFile(f)
                for sheet in xl.sheet_names:
                    # Skip clearly irrelevant sheets
                    if 'instruction' in sheet.lower(): continue
                    
                    # Read first 100 rows to find header and data
                    df_raw = pd.read_excel(f, sheet_name=sheet, header=None, nrows=100)
                    
                    # Look for keywords in rows to find header
                    header_row = -1
                    for i, row in df_raw.iterrows():
                        row_str = " ".join(str(cell).lower() for cell in row)
                        if any(kw in row_str for kw in ['otp', 'registracija', 'machine', 'inventar']) and \
                           any(kw in row_str for kw in ['litara', 'quantity', 'kolicina', 'litaza']):
                            header_row = i
                            break
                    
                    if header_row != -1:
                        print(f"  [FOUND DATA] Sheet: {sheet} | Header at row: {header_row}")
                        df = pd.read_excel(f, sheet_name=sheet, header=header_row)
                        print(df.head(10))
                        
                        # Check for August 2024
                        # We need to filter by date if multiple months are present
                        # or just sum all if the file is month-specific.
                        
                        # Let's save a summary of this sheet
                        df.to_csv(f"{f}_{sheet}_peek.csv", index=False)
            except Exception as e:
                print(f"  Error processing {f}: {e}")

if __name__ == '__main__':
    process_dizel_files()
