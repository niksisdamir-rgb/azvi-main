import pandas as pd

def s3_analysis():
    try:
        oil_log = pd.read_excel('Spisak servisa i dolivanja za mesec Avgust.xlsx', sheet_name='Servisi VIII Avgust Prnjavor')
        fuel_log = pd.read_excel('Betonska Baza/Tabele/DIZEL TABELA.xlsx', sheet_name='EDIT')
        
        # S3 Machines - Based on column 1 'Section' and column 2 'MAŠINA'
        # Skip header rows
        s3_data = oil_log[oil_log.iloc[:, 1].astype(str).str.contains('S3', na=False)]
        s3_machines = s3_data.iloc[:, 2].unique()
        s3_machines = [str(m).strip() for m in s3_machines if pd.notna(m)]
        
        # Fuel Machines - ID is in column 4 (header row index 3)
        fuel_data = fuel_log.iloc[4:] # Skip header rows
        fuel_machines = fuel_data.iloc[:, 4].astype(str).str.strip().unique()
        
        found = [m for m in s3_machines if m in fuel_machines]
        missing = [m for m in s3_machines if m not in fuel_machines]
        
        print(f"S3 SECTION COVERAGE ANALYSIS:")
        print(f"Machines found in S3 Oil Logs: {len(s3_machines)}")
        print(f"S3 Machines with Fueling Records: {len(found)} ({len(found)/len(s3_machines)*100 if s3_machines else 0:.1f}%)")
        print(f"S3 Machines MISSING Fuel Records: {len(missing)}")
        if missing:
            print(f"Sample missing: {missing[:10]}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    s3_analysis()
