# Data Analysis Report 
**Location:** `/home/k/Downloads/azvirt_dms/archive/New folder`
**Context:** The data appears to belong to **AzVirt** (a civil engineering and construction company), specifically related to operations and logistics for a construction project (likely the "Kvanj Tunnel" project, based on internal file names), including a concrete base ("Betonska Baza"). The language used is predominantly Serbo-Croatian/Bosnian.

## Overview
The directory contains **74 files and 2 subdirectories**. The files comprise various administrative, logistical, human resources, and operational records saved in formats such as `.xlsx`, `.pdf`, `.dbf`, `.csv`, `.txt`, and `.xml`. 

## Data Categories

### 1. Machinery & Equipment (`Mehanizacija`)
* **Machinery Logs (`MEHANIZACIJA.xlsx`, `MEHANIZACIJA KAMP.xlsx`, `MEHANIZACIJA BETONSKA BAZA.xlsx`)**: Track active machinery deployed across different operational zones (e.g., the camp and the concrete base).
* **Maintenance & Servicing (`Spisak servisa i dolivanja.xlsx`, `SERVISNI LIST_2025.docx`)**: Logs detailing machinery maintenance, service intervals, and liquid refills (e.g., oil).
* **Oil Tracking (`Utrošak ulja po mašinama.xlsx`)**: Specific tracking of oil consumption per machine (noted specifically for August).

### 2. Fuel Tracking (`Dizel`)
* **Diesel Usage (`DIZEL TABELA.xlsx`)**: Detailed tables dedicated to tracking diesel fuel dispensing and consumption, critical for heavy machinery operations.

### 3. Inventory & Materials (`Inventar / Zalihe`)
* **Inventory Templates (`Inventar_Sablon.xlsx`)**: Standardized templates for conducting and recording inventory counts.
* **Warehouse & Stocks (`skladiste zalihe.xlsx`, `evidencija o zalihama.xlsx`)**: Ongoing warehouse stock and inventory ledger data.
* **Material Usage (`ukupna upotreba materijala.pdf/xlsx`, `materijali.xlsx`)**: Aggregated metrics of materials used throughout the project lifecycle.
* **Material Analysis (`Izveštaj o analizi materijala`)**: Detailed material quality or breakdown reports available in multiple formats including `.dbf`, `.pdf`, `.html`, and XML data structures.

### 4. Logistics & Dispatch (`Otpremnice`)
* **Dispatch Notes (`Otpremnica` files)**: Records of materials/goods dispatched or received. Includes raw database files (`.dbf`), machine-readable formats (`.csv`, `.xml`), and export documents.
* *Inside the Exports*: CSV files (e.g., `Export.csv`, `Otpremnica.csv`) show data exported from weighbridges or dispatch software (e.g., company names like **Stenton Gradba DOO - Bitola**, Date, Start/End times, Material Recipe/`Receptura`, Order Quantities, and Vehicle License Plates). 

### 5. Personnel & Contacts (`Radnici / Osoblje`)
* **Worker Logs (`BLANKO_spisak_radnika-tunel Kvanj.xlsx`)**: Rosters and worker tracking lists for the Kvanj Tunnel operation.
* **Contact Books (Text files)**: Quick-reference text files holding phone numbers and names categorized by roles/locations:
  * `Inžinjeri.txt` (Engineers)
  * `KANCELARIJA.txt` (Office Staff)
  * `BAZA.txt` (Base Staff)
  * `VAGA.txt` (Weighbridge Operators)
  * `UTOVARIVAC.txt` (Loader Operators)

### 6. Management Reports
* **Monthly Reports (`AZVIRT_Mjesecni_Izvjestaj_2026.xlsx`)**: Aggregated monthly operational/financial/progress reports for the year 2026.
* **Fire Extinguisher Checks (`Spisak_Protivpozarnih_Aparata.xlsx`)**: Health and safety tracking records for fire extinguishers on site.

## Conclusion
This folder aggregates the standard administrative, mechanical, and logistical footprint of a heavy construction project site. It captures everything from the moment raw materials are weighed and dispatched (Otpremnice) to machinery fuel consumption, equipment maintenance, personnel contacts, and aggregated monthly operational reporting.

---

## Fuel Tracking Sub-Workflow (S2, S3, Prnjavor)

### Site Manager Workflow
1. **Request/Generate Template:** Site managers must request or execute `generate_unified_template.py` with arguments for `--section`, `--month`, and `--year` to receive an empty formatted template for the upcoming month.
2. **Data Entry:** Throughout the month, operators and site managers fill in the `Daily_Fuel_Log` sheet of the provided template. The entries must strictly include Date, Machine ID, Description, Fuel Quantity, and Odometer/Motorhours.
3. **Submission:** By the 5th of the following month, the site manager submits the completed ledger for auditing. The `verify_merge.py` script is then executed by the central administration to validate the schema and automatically format columns for integration into the master `DIZEL TABELA.xlsx`.

### Template Naming Convention
Generated files automatically follow the format:
`<SectionName>_Fuel_Reporting_Template_<MonthString>_<Year>.xlsx`
*(e.g., `S3_Fuel_Reporting_Template_September_2025.xlsx`, `Prnjavor_Fuel_Reporting_Template_September_2025.xlsx`)*

### Validation Criteria for Data Integration
* **File Format:** The submitted file must conform to the multi-sheet structure (`Daily_Fuel_Log`, `Machine_Reference`). Returning data must reside within `Daily_Fuel_Log`.
* **Machine ID Exact Match:** Input inside the "Machine ID (Inventar Code)" column must be strictly from the validated register present in `Machine_Reference` (e.g., formatted strictly as `OTP-<Numbers>`).
* **Mandatory Columns:** "Fuel Quantity (Liters)" must be numerical (> 0), and "Odometer/Motorhour Reading" must be present to enable efficiency/burn-rate analyses. Null or improper rows will be dropped or flagged during array processing.
