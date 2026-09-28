# ============================================================
# IT Service Desk - Exploratory Data Analysis (EDA)
# 8 Visualizations for Business Insights
# ============================================================

import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np
import os

# -- Setup --
os.makedirs('charts', exist_ok=True)
df = pd.read_csv('data/cleaned_data.csv')

# Set visual style
sns.set_theme(style='whitegrid', palette='muted')
plt.rcParams['figure.dpi'] = 120
plt.rcParams['font.size'] = 11

print("=" * 60)
print("  IT SERVICE DESK - EDA")
print(f"  Dataset: {df.shape[0]} rows x {df.shape[1]} columns")
print("=" * 60)

# ============================================================
# CHART 1: Ticket Volume by Day of Week (Bar Chart)
# Question: Are there more tickets on certain days?
# NOTE: Monthly trend chart was skewed because this is a synthetic dataset
#       with 65% of tickets clustered in June 2023. Day-of-week is more useful.
# ============================================================
day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
day_counts = df['Day'].value_counts().reindex(day_order)

plt.figure(figsize=(10, 5))
colors_day = ['#42A5F5'] * 5 + ['#FF7043'] * 2  # blue for weekdays, orange for weekends
day_counts.plot(kind='bar', color=colors_day)
plt.title('Chart 1: Ticket Volume by Day of Week', fontsize=14, fontweight='bold')
plt.xlabel('Day of Week')
plt.ylabel('Number of Tickets')
plt.xticks(rotation=0)

for i, v in enumerate(day_counts.values):
    plt.text(i, v + 30, str(v), ha='center', fontweight='bold')

plt.tight_layout()
plt.savefig('charts/01_ticket_volume_by_day.png')
plt.show()
print("[DONE] Chart 1 saved")

# ============================================================
# CHART 2: Tickets by Category (Horizontal Bar)
# Question: What types of issues are most common?
# ============================================================
cat_counts = df['Category'].value_counts()

plt.figure(figsize=(10, 5))
colors = ['#FF7043', '#42A5F5', '#66BB6A', '#AB47BC', '#FFA726']
cat_counts.plot(kind='barh', color=colors)
plt.title('Chart 2: Tickets by Category', fontsize=14, fontweight='bold')
plt.xlabel('Number of Tickets')
plt.ylabel('Category')

# Add count labels on bars
for i, v in enumerate(cat_counts.values):
    plt.text(v + 20, i, str(v), va='center', fontweight='bold')

plt.tight_layout()
plt.savefig('charts/02_tickets_by_category.png')
plt.show()
print("[DONE] Chart 2 saved")

# ============================================================
# CHART 3: Tickets by Priority (Bar Chart)
# Question: How are tickets distributed across priority levels?
# ============================================================
priority_order = ['Critical', 'High', 'Medium', 'Low']
pri_counts = df['Priority'].value_counts().reindex(priority_order)

plt.figure(figsize=(8, 5))
colors_pri = ['#D32F2F', '#FF5722', '#FFC107', '#4CAF50']
pri_counts.plot(kind='bar', color=colors_pri)
plt.title('Chart 3: Tickets by Priority Level', fontsize=14, fontweight='bold')
plt.xlabel('Priority')
plt.ylabel('Number of Tickets')
plt.xticks(rotation=0)

for i, v in enumerate(pri_counts.values):
    plt.text(i, v + 30, str(v), ha='center', fontweight='bold')

plt.tight_layout()
plt.savefig('charts/03_tickets_by_priority.png')
plt.show()
print("[DONE] Chart 3 saved")

# ============================================================
# CHART 4: Avg Resolution Hours by Category (Horizontal Bar)
# Question: Which issue types take longest to resolve?
# ============================================================
resolved = df[df['Resolution_Hours'].notna()]

avg_res = resolved.groupby('Category')['Resolution_Hours'].mean().sort_values()

plt.figure(figsize=(10, 5))
avg_res.plot(kind='barh', color='#26A69A')
plt.title('Chart 4: Avg Resolution Time by Category (Hours)', fontsize=14, fontweight='bold')
plt.xlabel('Average Resolution Hours')
plt.ylabel('Category')

for i, v in enumerate(avg_res.values):
    plt.text(v + 0.2, i, f'{v:.1f}h', va='center', fontweight='bold')

plt.tight_layout()
plt.savefig('charts/04_avg_resolution_by_category.png')
plt.show()
print("[DONE] Chart 4 saved")

# ============================================================
# CHART 5: Avg Resolution Hours by Priority (Bar Chart)
# Question: Do higher-priority tickets get resolved faster?
# ============================================================
avg_res_pri = resolved.groupby('Priority')['Resolution_Hours'].mean().reindex(priority_order)

plt.figure(figsize=(8, 5))
avg_res_pri.plot(kind='bar', color=colors_pri)
plt.title('Chart 5: Avg Resolution Time by Priority (Hours)', fontsize=14, fontweight='bold')
plt.xlabel('Priority')
plt.ylabel('Average Resolution Hours')
plt.xticks(rotation=0)

for i, v in enumerate(avg_res_pri.values):
    plt.text(i, v + 0.2, f'{v:.1f}h', ha='center', fontweight='bold')

plt.tight_layout()
plt.savefig('charts/05_avg_resolution_by_priority.png')
plt.show()
print("[DONE] Chart 5 saved")

# ============================================================
# CHART 6: Tickets by Channel (Pie/Donut Chart)
# Question: Which support channels are customers using most?
# ============================================================
channel_counts = df['Channel'].value_counts()

plt.figure(figsize=(8, 6))
wedges, texts, autotexts = plt.pie(
    channel_counts.values,
    labels=channel_counts.index,
    autopct='%1.1f%%',
    startangle=90,
    colors=['#5C6BC0', '#26C6DA', '#FF7043', '#66BB6A'],
    wedgeprops=dict(width=0.6)  # donut shape
)
for autotext in autotexts:
    autotext.set_fontweight('bold')
plt.title('Chart 6: Tickets by Support Channel', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.savefig('charts/06_tickets_by_channel.png')
plt.show()
print("[DONE] Chart 6 saved")

# ============================================================
# CHART 7: Satisfaction Score vs Resolution Hours (Scatter)
# Question: Does faster resolution lead to higher satisfaction?
# ============================================================
rated = df[df['Satisfaction_Score'].notna() & df['Resolution_Hours'].notna()]

plt.figure(figsize=(10, 6))
sns.scatterplot(
    data=rated,
    x='Resolution_Hours',
    y='Satisfaction_Score',
    hue='Priority',
    hue_order=priority_order,
    palette=['#D32F2F', '#FF5722', '#FFC107', '#4CAF50'],
    alpha=0.6,
    s=40
)
plt.title('Chart 7: Satisfaction vs Resolution Time', fontsize=14, fontweight='bold')
plt.xlabel('Resolution Hours')
plt.ylabel('Satisfaction Score (1-5)')

# Add correlation value
if len(rated) > 2:
    corr = rated['Resolution_Hours'].corr(rated['Satisfaction_Score'])
    plt.text(0.02, 0.95, f'Correlation: {corr:.3f}', transform=plt.gca().transAxes,
             fontsize=11, fontweight='bold', bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))

plt.tight_layout()
plt.savefig('charts/07_satisfaction_vs_resolution.png')
plt.show()
print("[DONE] Chart 7 saved")

# ============================================================
# CHART 8: SLA Performance (Stacked Bar by Priority)
# Question: Which priority levels breach SLA most often?
# ============================================================
sla_data = df[df['SLA_Met'].notna()].copy()
sla_data['SLA_Met'] = sla_data['SLA_Met'].map({True: 'Met', 'True': 'Met', False: 'Breached', 'False': 'Breached'})

sla_cross = pd.crosstab(sla_data['Priority'], sla_data['SLA_Met'])
sla_cross = sla_cross.reindex(priority_order)

plt.figure(figsize=(8, 5))
sla_cross.plot(kind='bar', stacked=True, color=['#EF5350', '#66BB6A'], ax=plt.gca())
plt.title('Chart 8: SLA Performance by Priority', fontsize=14, fontweight='bold')
plt.xlabel('Priority')
plt.ylabel('Number of Tickets')
plt.xticks(rotation=0)
plt.legend(title='SLA Status')
plt.tight_layout()
plt.savefig('charts/08_sla_performance.png')
plt.show()
print("[DONE] Chart 8 saved")

# ============================================================
# Summary Statistics
# ============================================================
print("\n" + "=" * 60)
print("  EDA SUMMARY")
print("=" * 60)
print(f"  Total tickets: {len(df)}")
print(f"  Resolved tickets: {df['Is_Resolved'].sum()}")
print(f"  Open/Pending tickets: {(~df['Is_Resolved']).sum()}")
print(f"  Avg Resolution Hours (valid): {resolved['Resolution_Hours'].mean():.1f}h")
print(f"  Median Resolution Hours: {resolved['Resolution_Hours'].median():.1f}h")
if len(rated) > 0:
    print(f"  Avg Satisfaction Score: {rated['Satisfaction_Score'].mean():.2f} / 5")
sla_valid = df[df['SLA_Met'].notna()]
sla_met_count = sla_valid['SLA_Met'].apply(lambda x: str(x) == 'True').sum()
print(f"  SLA Compliance Rate: {sla_met_count}/{len(sla_valid)} ({sla_met_count/len(sla_valid)*100:.1f}%)")
print(f"\n  All 8 charts saved to: charts/")
print("=" * 60)