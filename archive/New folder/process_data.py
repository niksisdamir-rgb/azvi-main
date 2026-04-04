import pandas as pd
import os
import numpy as np

def normalize_id(val):
    if pd.isna(val):
        return None
    s = str(val).strip().split('.')[0]
    # Handle weird spaces like "56 13 1"
    s = s.replace(' ', '')
    s = s.lstrip('0').upper()
    if s in ['', 'NAN', 'NONE', 'TOTAL', 'UKUPNO', 'GRAND']:
        return None
    return s

def aggregate_consumption():
    cwd = '/home/k/Downloads/azvirt_dms/archive/New folder'
    oil_file = os.path.join(cwd, 'Utrošak ulja po mašinama za mesec Avgust  VIII.xlsx')
    diesel_file = os.path.join(cwd, 'DIZEL TABELA.xlsx')
    
    # 1. Load Mapping (from Sheet2 of DIZEL)
    # Sheet2: GARAŽNI BROJ: | REGISTRACIJA:
    mapping_df = pd.read_excel(diesel_file, sheet_name='Sheet2')
    # Column 0: Garage No, Column 1: Plate
    id_map = {}
    for _, row in mapping_df.iterrows():
        g_id = normalize_id(row.iloc[0])
        p_id = normalize_id(row.iloc[1])
        if g_id and p_id:
            id_map[p_id] = g_id # Map plates to garage numbers
            id_map[g_id] = g_id # Identity map garage numbers
            
    # 2. Load Diesel Consumption (Sheet: EDIT)
    diesel_df = pd.read_excel(diesel_file, sheet_name='EDIT', skiprows=2)
    d_id_col = diesel_df.columns[4]
    d_qty_col = diesel_df.columns[7]
    d_desc_col = diesel_df.columns[1]
    
    # Normalize IDs in Diesel and try to match with garage numbers
    diesel_df['Raw_ID'] = diesel_df[d_id_col].apply(normalize_id)
    diesel_df['Machine_ID'] = diesel_df['Raw_ID'].apply(lambda x: id_map.get(x, x))
    diesel_df = diesel_df.dropna(subset=['Machine_ID'])
    diesel_df[d_qty_col] = pd.to_numeric(diesel_df[d_qty_col], errors='coerce').fillna(0)
    
    d_grouped = diesel_df.groupby('Machine_ID')[d_qty_col].sum().reset_index()
    d_grouped.rename(columns={d_qty_col: 'Total_Diesel_Liters'}, inplace=True)
    
    d_desc = diesel_df.dropna(subset=[d_desc_col]).groupby('Machine_ID')[d_desc_col].first().reset_index()
    d_desc.rename(columns={d_desc_col: 'Description'}, inplace=True)

    # 3. Load Oil Consumption
    oil_df = pd.read_excel(oil_file, sheet_name='Utrošak ulja po mašinama VIII P', skiprows=7)
    o_id_col = oil_df.columns[3]
    o_total_col = oil_df.columns[12]
    o_cols_to_sum = oil_df.columns[4:12]
    
    oil_df['Machine_ID'] = oil_df[o_id_col].apply(lambda x: id_map.get(normalize_id(x), normalize_id(x)))
    oil_df = oil_df.dropna(subset=['Machine_ID'])
    
    for col in o_cols_to_sum:
        oil_df[col] = pd.to_numeric(oil_df[col], errors='coerce').fillna(0)
    oil_df[o_total_col] = pd.to_numeric(oil_df[o_total_col], errors='coerce').fillna(0)
    
    oil_grouped = oil_df.groupby('Machine_ID').agg({
        o_total_col: 'sum',
        **{c: 'sum' for c in o_cols_to_sum}
    }).reset_index()
    oil_grouped.rename(columns={o_total_col: 'Total_Oil_Liters'}, inplace=True)

    # 4. Merge
    result = pd.merge(d_desc, d_grouped, on='Machine_ID', how='outer')
    result = pd.merge(result, oil_grouped, on='Machine_ID', how='outer')
    
    # Fill defaults
    result['Total_Diesel_Liters'] = result['Total_Diesel_Liters'].fillna(0)
    result['Total_Oil_Liters'] = result['Total_Oil_Liters'].fillna(0)
    result['Description'] = result['Description'].fillna('Unknown Mach.')
    
    # Analysis
    result['Oil_to_Fuel_Ratio_%'] = (result['Total_Oil_Liters'] / result['Total_Diesel_Liters'].replace(0, float('nan')) * 100).fillna(0)
    
    # Anomaly Filtering
    # 0.5% - 1.0% is typical for large machinery. > 2% is high. > 5% is problematic.
    def get_flag(row):
        ratio = row['Oil_to_Fuel_Ratio_%']
        oil = row['Total_Oil_Liters']
        fuel = row['Total_Diesel_Liters']
        
        flags = []
        if ratio > 5: flags.append('CRITICAL: EXTREME OIL CONSUMPTION (>5%)')
        elif ratio > 2: flags.append('WARNING: HIGH OIL CONSUMPTION (>2%)')
        
        if oil > 50 and fuel == 0: flags.append('AUDIT: LARGE OIL DRAW WITH NO FUEL RECORDED')
        elif oil > 5 and fuel == 0: flags.append('INFO: OIL ADDED NO FUEL RECORDED')
            
        return " | ".join(flags)
        
    result['Anomalies'] = result.apply(get_flag, axis=1)
    result = result.sort_values(['Total_Oil_Liters', 'Oil_to_Fuel_Ratio_%'], ascending=False)
    
    # Final cleanup: machine IDs should be consistent
    result['Machine_ID'] = result['Machine_ID'].astype(str)
    
    # Output
    output_path = os.path.join(cwd, 'Machine_Consumption_Analysis.xlsx')
    result.to_excel(output_path, index=False)
    
    print(f"Final analysis saved to {output_path}")
    print("\nTop Consumption / Anomaly Overview:")
    print(result[['Machine_ID', 'Description', 'Total_Diesel_Liters', 'Total_Oil_Liters', 'Oil_to_Fuel_Ratio_%', 'Anomalies']].head(20).to_string(index=False))

if __name__ == '__main__':
    aggregate_consumption()
