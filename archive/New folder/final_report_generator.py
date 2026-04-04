import pandas as pd
import os

cwd = os.getcwd()

# 1. Load Diesel Data
diesel_file = os.path.join(cwd, 'DIZEL TABELA.xlsx')
df_diesel = pd.read_excel(diesel_file, sheet_name='EDIT')
# Columns: Date, No., Machine, Plate, Plate Number, Amount
fuel_data = df_diesel.iloc[:, [2, 5]].copy()
fuel_data.columns = ['MachineID', 'FuelAmount']
fuel_data['FuelAmount'] = pd.to_numeric(fuel_data['FuelAmount'], errors='coerce').fillna(0)
fuel_data = fuel_data.groupby('MachineID').sum().reset_index()

# 2. Load Oil Data
oil_file = os.path.join(cwd, 'Spisak servisa i dolivanja za mesec Avgust.xlsx')
df_oil = pd.read_excel(oil_file)
# Inventory No. is column 4, Litr is column 9, Servis/Dolivanje is column 10
oil_records = df_oil.iloc[4:, [4, 8, 9, 10, 13, 14]].copy()
oil_records.columns = ['MachineID', 'TypeShort', 'Amount', 'Status', 'FullName', 'Category']
oil_records['Amount'] = pd.to_numeric(oil_records['Amount'], errors='coerce').fillna(0)

# Aggregate oil by machine
machine_oil = oil_records.groupby('MachineID').agg({
    'Amount': 'sum',
    'Status': lambda x: ', '.join(set(str(v) for v in x if pd.notnull(v))),
    'Category': lambda x: ', '.join(set(str(v) for v in x if pd.notnull(v)))
}).reset_index()
machine_oil.columns = ['MachineID', 'TotalOil', 'Activities', 'OilProducts']

# 3. Merge
report = pd.merge(machine_oil, fuel_data, on='MachineID', how='outer').fillna(0)

# 4. Anomaly Detection
report['Anomaly_FuelMissing'] = (report['TotalOil'] > 0) & (report['FuelAmount'] == 0)
report['Anomaly_OilMissing'] = (report['FuelAmount'] > 0) & (report['TotalOil'] == 0)

# 5. Output
report.to_csv('consolidated_fleet_report.csv', index=False)
report.to_excel('consolidated_fleet_report.xlsx', index=False)

print(f"Generated report with {len(report)} machines.")
print(f"Detected {report['Anomaly_FuelMissing'].sum()} machines with OIL usage but NO FUEL records.")
print(f"Detected {report['Anomaly_OilMissing'].sum()} machines with FUEL usage but NO OIL records.")
