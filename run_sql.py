# ============================================================
# IT Service Desk - SQL Query Executor
# Loads cleaned_data.csv into SQLite DB and runs 10 business queries
# ============================================================

import sqlite3
import pandas as pd
import os

def run_analytics_queries():
    # 1. Paths setup
    csv_path = 'data/cleaned_data.csv'
    db_path = 'data/it_tickets.db'
    sql_path = 'sql/analysis.sql'

    if not os.path.exists(csv_path):
        print(f"[ERROR] Cleaned CSV not found at {csv_path}. Please run dataPrepro.py first.")
        return

    print("=" * 70)
    print("  IT SERVICE DESK - SQL BUSINESS ANALYSIS  ")
    print("=" * 70)

    # 2. Load CSV into SQLite Database
    df = pd.read_csv(csv_path)
    conn = sqlite3.connect(db_path)
    df.to_sql('tickets', conn, if_exists='replace', index=False)
    print(f"[OK] Database loaded: {db_path} ({len(df)} rows)")

    # 3. Read SQL File
    with open(sql_path, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    # Separate queries split by ';'
    raw_queries = [q.strip() for q in sql_content.split(';') if q.strip()]

    # Extract comments/titles and execute
    query_num = 1
    for raw_q in raw_queries:
        lines = raw_q.split('\n')
        title_lines = [line.strip('- ').strip() for line in lines if line.strip().startswith('-- QUERY') or line.strip().startswith('-- Purpose')]
        
        title = f"QUERY {query_num}"
        purpose = ""
        for line in title_lines:
            if 'QUERY' in line:
                title = line
            elif 'Purpose' in line:
                purpose = line

        clean_sql_lines = [line for line in lines if not line.strip().startswith('--')]
        clean_sql = '\n'.join(clean_sql_lines).strip()

        if not clean_sql:
            continue

        print("\n" + "=" * 70)
        print(f"  {title}")
        if purpose:
            print(f"  {purpose}")
        print("-" * 70)
        
        try:
            result_df = pd.read_sql_query(clean_sql, conn)
            print(result_df.to_string(index=False))
            query_num += 1
        except Exception as e:
            print(f"[ERROR executing query]: {e}")

    conn.close()
    print("\n" + "=" * 70)
    print(f"  [DONE] All {query_num - 1} SQL queries executed successfully.")
    print("=" * 70)

if __name__ == '__main__':
    run_analytics_queries()
