import numpy as np
import pandas as pd

# ============================================================
# STEP 1: Load raw data
# ============================================================
df = pd.read_csv('data/it_tickets.csv')
print("=" * 60)
print("STEP 1: Raw data loaded")
print(f"Shape: {df.shape}")
print(f"Columns: {df.columns.tolist()}")

# ============================================================
# STEP 2: Rename columns (cleaner, consistent names)
# ============================================================
df = df.rename(columns={
    'Ticket ID': 'Ticket_ID',
    'Customer Name': 'Customer_Name',
    'Customer Email': 'Customer_Email',
    'Customer Age': 'Customer_Age',
    'Customer Gender': 'Customer_Gender',
    'Product Purchased': 'Product',
    'Date of Purchase': 'Purchase_Date',
    'Ticket Type': 'Category',
    'Ticket Subject': 'Subcategory',
    'Ticket Description': 'Description',
    'Ticket Status': 'Status',
    'Resolution': 'Resolution',
    'Ticket Priority': 'Priority',
    'Ticket Channel': 'Channel',
    'First Response Time': 'First_Response_Time',
    'Time to Resolution': 'Resolved_Date',
    'Customer Satisfaction Rating': 'Satisfaction_Score',
})
print("\n" + "=" * 60)
print("STEP 2: Columns renamed")
print(f"New columns: {df.columns.tolist()}")

# ============================================================
# STEP 3: Check & remove duplicates
# ============================================================
dup_count = df.duplicated().sum()
dup_id_count = df['Ticket_ID'].duplicated().sum()
print("\n" + "=" * 60)
print(f"STEP 3: Duplicates check")
print(f"  Duplicate rows: {dup_count}")
print(f"  Duplicate Ticket_IDs: {dup_id_count}")
df = df.drop_duplicates(subset='Ticket_ID')
print(f"  Shape after dedup: {df.shape}")

# ============================================================
# STEP 4: Handle missing values
# ============================================================
print("\n" + "=" * 60)
print("STEP 4: Missing values BEFORE handling")
print(df.isnull().sum())
print(f"\n  - Resolution: {df['Resolution'].isnull().sum()} nulls (tickets still open)")
print(f"  - Resolved_Date: {df['Resolved_Date'].isnull().sum()} nulls")
print(f"  - Satisfaction_Score: {df['Satisfaction_Score'].isnull().sum()} nulls")
print(f"  - First_Response_Time: {df['First_Response_Time'].isnull().sum()} nulls")

# NOTE: 5700 nulls in Resolution, Resolved_Date, and Satisfaction_Score
# are the SAME rows — these are tickets that are still Open/Pending.
# We keep them because open-ticket analysis is valuable too.

# Fill Resolution text for unresolved tickets
df['Resolution'] = df['Resolution'].fillna('Unresolved')

# Keep Satisfaction_Score as NaN for unresolved tickets (we'll filter when needed)
# Keep Resolved_Date as NaN for unresolved tickets

print("\nMissing values AFTER handling:")
print(df.isnull().sum())

# ============================================================
# STEP 5: Convert date columns to datetime
# ============================================================
df['Purchase_Date'] = pd.to_datetime(df['Purchase_Date'], errors='coerce')
df['First_Response_Time'] = pd.to_datetime(df['First_Response_Time'], errors='coerce')
df['Resolved_Date'] = pd.to_datetime(df['Resolved_Date'], errors='coerce')

print("\n" + "=" * 60)
print("STEP 5: Date columns converted to datetime")
print(df[['Purchase_Date', 'First_Response_Time', 'Resolved_Date']].dtypes)

# ============================================================
# STEP 6: Feature Engineering
# ============================================================
print("\n" + "=" * 60)
print("STEP 6: Feature Engineering")

# 6a. Resolution time in hours (only for resolved tickets)
df['Resolution_Hours'] = (
    df['Resolved_Date'] - df['First_Response_Time']
).dt.total_seconds() / 3600
df['Resolution_Hours'] = df['Resolution_Hours'].round(2)

# Fix negative resolution times (bad data: resolved before first response)
neg_count = (df['Resolution_Hours'] < 0).sum()
print(f"  Resolution_Hours - negative values found: {neg_count} (set to NaN)")
df.loc[df['Resolution_Hours'] < 0, 'Resolution_Hours'] = np.nan

print(f"  Resolution_Hours - valid count: {df['Resolution_Hours'].notna().sum()}")

# 6b. First response time in hours (from ticket creation approximation)
# Since we don't have a Created_Date, First_Response_Time IS our earliest timestamp

# 6c. Month (from First_Response_Time for resolved, or use Purchase_Date fallback)
ref_date = df['First_Response_Time'].fillna(df['Purchase_Date'])
df['Month'] = ref_date.dt.to_period('M').astype(str)
df['Year'] = ref_date.dt.year
df['Day'] = ref_date.dt.day_name()
df['Is_Weekend'] = ref_date.dt.dayofweek >= 5
print(f"  Month, Year, Day, Is_Weekend - created")

# 6d. SLA_Met — based on priority-based resolution time thresholds
sla_thresholds = {
    'Critical': 4,    # must resolve within 4 hours
    'High': 8,        # within 8 hours
    'Medium': 24,     # within 24 hours
    'Low': 48          # within 48 hours
}

def check_sla(row):
    if pd.isna(row['Resolution_Hours']):
        return np.nan  # can't determine for unresolved tickets
    threshold = sla_thresholds.get(row['Priority'], 48)
    return row['Resolution_Hours'] <= threshold

df['SLA_Met'] = df.apply(check_sla, axis=1)
sla_counts = df['SLA_Met'].value_counts(dropna=False)
print(f"  SLA_Met - True: {sla_counts.get(True, 0)}, False: {sla_counts.get(False, 0)}, NaN: {sla_counts.get(np.nan, 0)}")

# 6e. Is_Resolved flag
df['Is_Resolved'] = df['Status'] == 'Closed'
print(f"  Is_Resolved - Resolved: {df['Is_Resolved'].sum()}, Unresolved: {(~df['Is_Resolved']).sum()}")

# ============================================================
# STEP 7: Standardize categorical values
# ============================================================
print("\n" + "=" * 60)
print("STEP 7: Categorical value check")
print(f"  Priority values: {df['Priority'].unique().tolist()}")
print(f"  Status values: {df['Status'].unique().tolist()}")
print(f"  Category values: {df['Category'].unique().tolist()}")
print(f"  Channel values: {df['Channel'].unique().tolist()}")
print(f"  Gender values: {df['Customer_Gender'].unique().tolist()}")

# Strip whitespace from all string columns
for col in df.select_dtypes(include='object').columns:
    df[col] = df[col].astype(str).str.strip()
    df[col] = df[col].replace('nan', np.nan)  # restore NaN after str conversion

# ============================================================
# STEP 8: Drop columns not needed for analysis
# ============================================================
# Keep: Ticket_ID, Product, Category, Subcategory, Priority, Status,
#        Channel, Satisfaction_Score, Resolution_Hours, Month, Year,
#        Day, Is_Weekend, SLA_Met, Is_Resolved, Customer_Age, Customer_Gender
# Drop: Customer_Name, Customer_Email, Description, Resolution (text-heavy, not needed for dashboard)

cols_to_drop = ['Customer_Name', 'Customer_Email', 'Description', 'Resolution']
df = df.drop(columns=cols_to_drop)

print("\n" + "=" * 60)
print("STEP 8: Dropped unnecessary columns")
print(f"  Dropped: {cols_to_drop}")
print(f"  Remaining columns: {df.columns.tolist()}")

# ============================================================
# STEP 9: Final summary & save
# ============================================================
print("\n" + "=" * 60)
print("STEP 9: Final cleaned dataset")
print(f"  Shape: {df.shape}")
print(f"  Columns: {df.columns.tolist()}")
print(f"\n  Dtypes:\n{df.dtypes}")
print(f"\n  Null counts:\n{df.isnull().sum()}")
print(f"\n  First 5 rows:")
print(df.head())

# Save cleaned data
import os
os.makedirs('data', exist_ok=True)
df.to_csv('data/cleaned_data.csv', index=False)
print(f"\n[DONE] Cleaned data saved to: data/cleaned_data.csv")