import pandas as pd
import os

def analyze_detailed_files():
    # 1. Analysis of 'Utrošak ulja po mašinama za mesec Avgust  VIII.xlsx'
    oil_file = 'Utrošak ulja po mašinama za mesec Avgust  VIII.xlsx'
    if os.path.exists(oil_file):
        print(f"\nAnalyzing {oil_file}...")
        xls = pd.ExcelFile(oil_file)
        for sheet in xls.sheet_names:
            df = pd.read_excel(oil_file, sheet_name=sheet)
            # Find the header row (contains 'Garažni broj' or similar)
            # Usually it's several rows down in these templates
            print(f"\nSheet: {sheet}")
            # Show columns to identify structure
            print("Columns:", df.columns.tolist()[:10])
            # Show a slice of data where actual entries start
            # Dropping all-NaN rows to see content
            df_content = df.dropna(how='all')
            print("First 10 rows with content:")
            print(df_content.head(10).to_string())

    # 2. Analysis of 'Spisak servisa i dolivanja za mesec Avgust.xlsx'
    service_file = 'Spisak servisa i dolivanja za mesec Avgust.xlsx'
    if os.path.exists(service_file):
        print(f"\nAnalyzing {service_file}...")
        xls = pd.ExcelFile(service_file)
        for sheet in xls.sheet_names:
            df = pd.read_excel(service_file, sheet_name=sheet)
            print(f"\nSheet: {sheet}")
            df_content = df.dropna(how='all')
            print("First 10 rows with content:")
            print(df_content.head(10).to_string())

if __name__ == '__main__':
    analyze_detailed_files()
