import os
import pandas as pd

def analyze():
    files = [f for f in os.listdir('.') if f.endswith('.xlsx')]
    for f in files:
        try:
            xl = pd.ExcelFile(f)
            for sheet in xl.sheet_names:
                df = xl.parse(sheet, nrows=20)
                # print(f"FILE: {f} | SHEET: {sheet}")
                # Look for S2 or Prnjavor or S3
                text = str(df.values).lower() + f.lower() + sheet.lower()
                if ('s2' in text or 'prnjavor' in text or 's3' in text) and ('gorivo' in text or 'dizel' in text or 'fuel' in text):
                    print(f"\nMATCH FOUND: {f} | {sheet}")
                    print(df.head(10))
        except:
            continue

if __name__ == '__main__':
    analyze()
