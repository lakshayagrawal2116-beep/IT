import pandas as pd

df = pd.read_csv('data/it_tickets.csv')

print("=== SHAPE ===")
print(df.shape)

print("\n=== DTYPES ===")
print(df.dtypes)

print("\n=== NULL COUNTS ===")
print(df.isnull().sum())

print("\n=== DUPLICATES ===")
print("Duplicate rows:", df.duplicated().sum())
print("Duplicate Ticket IDs:", df['Ticket ID'].duplicated().sum())

print("\n=== SAMPLE VALUES (first 5 unique per column) ===")
for col in df.columns:
    print(f"\n{col}:")
    print(df[col].dropna().unique()[:5])

print("\n=== DESCRIBE ===")
print(df.describe())

print("\n=== DESCRIBE (categoricals) ===")
print(df.describe(include='object'))
