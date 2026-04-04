import pandas as pd
import os

# Load the consolidated report to get machines with anomalies
try:
    report = pd.read_csv('consolidated_fleet_report.csv')
    anomaly_machines = report[(report['Anomaly_FuelMissing'] == True) | (report['Anomaly_OilMissing'] == True)]['MachineID'].astype(str).tolist()
except Exception as e:
    print(f"Error loading report: {e}")
    anomaly_machines = []

# Normalization function
def norm_id(id_val):
    if pd.isna(id_val): return ""
    s = str(id_val).split('.')[0].strip().zfill(4)
    return s

def get_servicers():
    results = []
    
    # 1. Check Fuel Table
    try:
        fuel_df = pd.read_excel('Betonska Baza/Tabele/DIZEL TABELA.xlsx', sheet_name='EDIT', header=3)
        fuel_col_id = 'Plate number or                inventar code'
        fuel_col_received = 'Received by '
        
        for _, row in fuel_df.iterrows():
            m_id = norm_id(row.get(fuel_col_id))
            if m_id in anomaly_machines:
                receiv_by = str(row.get(fuel_col_received, 'N/A'))
                if receiv_by and receiv_by != 'nan':
                    results.append({
                        'MachineID': m_id,
                        'AnomalyType': 'Fuel Service Record',
                        'Serviser/Receiver': receiv_by,
                        'Source': 'DIZEL TABELA'
                    })
    except Exception as e:
        print(f"Error processing Fuel Table: {e}")

    # 2. Check Oil Table
    try:
        oil_df = pd.read_excel('Spisak servisa i dolivanja za mesec Avgust.xlsx', header=4)
        oil_col_id = 'Inventory No.'
        oil_col_section = 'Section'
        
        for _, row in oil_df.iterrows():
            m_id = norm_id(row.get(oil_col_id))
            if m_id in anomaly_machines:
                section = str(row.get(oil_col_section, 'N/A'))
                if section and section != 'nan' and 'Uradio' not in section:
                    results.append({
                        'MachineID': m_id,
                        'AnomalyType': 'Oil Service Record',
                        'Serviser/Receiver': section,
                        'Source': 'Oil Spisak'
                    })
    except Exception as e:
        print(f"Error processing Oil Table: {e}")

    return pd.DataFrame(results)

if __name__ == "__main__":
    df_servicers = get_servicers()
    if not df_servicers.empty:
        # Group by Serviser and count occurrences
        summary = df_servicers.groupby(['Serviser/Receiver', 'Source']).size().reset_index(name='Anomaly_Incident_Count')
        print("\n--- Servicer Anomaly Impact Summary ---")
        print(summary)
        
        # Save to file
        df_servicers.to_csv('servicer_anomaly_mapping.csv', index=False)
        summary.to_csv('servicer_impact_summary.csv', index=False)
        print("\nDetailed mapping saved to 'servicer_anomaly_mapping.csv'")
    else:
        print("No servicer data found for anomaly machines.")
