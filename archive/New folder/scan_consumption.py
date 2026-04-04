import pandas as pd
import os

keywords = ['DIZEL', 'GORIVO', 'NAFTA', 'FUEL', 'LITARA', 'LIT']

def search_files():
    found_files = []
    for root, dirs, files in os.walk('.'):
        for file in files:
            if file.endswith('.xlsx'):
                path = os.path.join(root, file)
                try:
                    xl = pd.ExcelFile(path)
                    for sheet in xl.sheet_names:
                        df = xl.parse(sheet)
                        # Check columns and values
                        cols = [str(c) for c in df.columns]
                        if any(any(kw in c.upper() for kw in keywords) for c in cols):
                            print(f"FOUND KEYWORD IN COLUMN: {path} -> {sheet}")
                            found_files.append(path)
                            continue
                        
                        # Check first 50 rows of data
                        sample = df.head(50).astype(str)
                        if sample.apply(lambda x: x.str.contains('|'.join(keywords), case=False)).any().any():
                            print(f"FOUND KEYWORD IN DATA: {path} -> {sheet}")
                            found_files.append(path)
                except Exception as e:
                    pass
    return list(set(found_files))

if __name__ == "__main__":
    search_files()
