import pandas as pd
import os

def scan_all_sheets():
    filepath = 'DIZEL TABELA.xlsx'
    try:
        xls = pd.ExcelFile(filepath)
        for sheet in xls.sheet_names:
            print(f"\n[{sheet}]")
            df = pd.read_excel(filepath, sheet_name=sheet)
            # Count non-nulls in each column to see if there's actual data
            stats = df.count()
            data_cols = stats[stats > 0]
            if not data_cols.empty:
                print(f"Data found in {len(data_cols)} columns. Max rows with data: {data_cols.max()}")
                print("First non-empty rows:")
                df_clean = df.dropna(how='all', axis=0).dropna(how='all', axis=1)
                print(df_clean.head(5).to_string())
            else:
                print("Sheet is empty.")
    except Exception as e:
        print(f"Scan failed: {e}")

if __name__ == '__main__':
    scan_all_sheets()
