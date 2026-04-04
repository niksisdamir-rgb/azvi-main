import pandas as pd
import os

def generate_final():
    try:
        report = pd.read_csv('consolidated_fleet_report.csv')
        servicers = pd.read_csv('servicer_anomaly_mapping.csv')
        
        # Merge servicers
        if not servicers.empty:
            serv_agg = servicers.groupby('MachineID')['Serviser/Receiver'].apply(lambda x: ', '.join(set([s for s in x if str(s) != 'nan']))).reset_index()
            report['MachineID'] = report['MachineID'].astype(str).str.split('.').str[0].str.zfill(4)
            serv_agg['MachineID'] = serv_agg['MachineID'].astype(str).str.zfill(4)
            final_df = pd.merge(report, serv_agg, on='MachineID', how='left')
        else:
            final_df = report
            final_df['Serviser/Receiver'] = 'N/A'

        # Rename columns for clarity
        final_df.rename(columns={
            'Anomaly_FuelMissing': 'Missing_From_Fuel_Report',
            'Anomaly_OilMissing': 'Missing_From_Oil_Report',
            'Serviser/Receiver': 'Log_Section/Responsible'
        }, inplace=True)

        final_df['Has_Anomaly'] = final_df['Missing_From_Fuel_Report'] | final_df['Missing_From_Oil_Report']
        final_df = final_df.sort_values(by='Has_Anomaly', ascending=False)

        output_file = 'Fleet_Analysis_August_2025.xlsx'
        with pd.ExcelWriter(output_file) as writer:
            final_df.to_excel(writer, sheet_name='Machine Analysis', index=False)
            
            # Detailed Stats
            stats = {
                'Category': [
                    'Total Unique Machines Analyzed',
                    'Total Machines with Anomalies',
                    'Machines in Oil Log but Missing Fuel Data',
                    'Machines in Fuel Log but Missing Oil Data'
                ],
                'Count': [
                    len(final_df),
                    len(final_df[final_df['Has_Anomaly'] == True]),
                    len(final_df[final_df['Missing_From_Fuel_Report'] == True]),
                    len(final_df[final_df['Missing_From_Oil_Report'] == True])
                ]
            }
            pd.DataFrame(stats).to_excel(writer, sheet_name='Executive Summary', index=False)

        print(f"Final report generated: {output_file}")
        
    except Exception as e:
        print(f"Error generating final report: {e}")

if __name__ == "__main__":
    generate_final()
