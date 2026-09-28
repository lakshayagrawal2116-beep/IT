-- ============================================================
-- IT Service Desk Performance Analytics - SQL Queries
-- Database Engine: SQLite / ANSI SQL
-- Description: 10 Analytical Queries for Business Insights
-- ============================================================

-- ------------------------------------------------------------
-- QUERY 1: Ticket Distribution by Status
-- Purpose: Understand volume of Open vs Closed vs Pending tickets.
-- ------------------------------------------------------------
SELECT 
    Status,
    COUNT(*) AS Ticket_Count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM tickets), 2) AS Percentage
FROM tickets
GROUP BY Status
ORDER BY Ticket_Count DESC;


-- ------------------------------------------------------------
-- QUERY 2: Ticket Volume by Issue Category
-- Purpose: Identify the primary sources of customer support requests.
-- ------------------------------------------------------------
SELECT 
    Category,
    COUNT(*) AS Ticket_Count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM tickets), 2) AS Percentage
FROM tickets
GROUP BY Category
ORDER BY Ticket_Count DESC;


-- ------------------------------------------------------------
-- QUERY 3: Average Resolution Time by Priority Level
-- Purpose: Check if Critical tickets are being prioritized and resolved faster.
-- ------------------------------------------------------------
SELECT 
    Priority,
    COUNT(*) AS Resolved_Tickets,
    ROUND(AVG(Resolution_Hours), 2) AS Avg_Resolution_Hours
FROM tickets
WHERE Resolution_Hours IS NOT NULL
GROUP BY Priority
ORDER BY Avg_Resolution_Hours ASC;


-- ------------------------------------------------------------
-- QUERY 4: Average Resolution Time by Issue Category
-- Purpose: Determine which types of problems take longest to fix.
-- ------------------------------------------------------------
SELECT 
    Category,
    COUNT(*) AS Resolved_Tickets,
    ROUND(AVG(Resolution_Hours), 2) AS Avg_Resolution_Hours
FROM tickets
WHERE Resolution_Hours IS NOT NULL
GROUP BY Category
ORDER BY Avg_Resolution_Hours DESC;


-- ------------------------------------------------------------
-- QUERY 5: Top 5 Slowest Resolving Products
-- Purpose: Pinpoint specific products causing support bottlenecks.
-- ------------------------------------------------------------
SELECT 
    Product,
    COUNT(*) AS Resolved_Tickets,
    ROUND(AVG(Resolution_Hours), 2) AS Avg_Resolution_Hours
FROM tickets
WHERE Resolution_Hours IS NOT NULL
GROUP BY Product
HAVING COUNT(*) >= 20
ORDER BY Avg_Resolution_Hours DESC
LIMIT 5;


-- ------------------------------------------------------------
-- QUERY 6: SLA Compliance Rate by Priority Level
-- Purpose: Evaluate SLA fulfillment rates across Critical, High, Medium, and Low priorities.
-- ------------------------------------------------------------
SELECT 
    Priority,
    COUNT(*) AS Total_Evaluated,
    SUM(CASE WHEN SLA_Met = 1 OR SLA_Met = 'True' THEN 1 ELSE 0 END) AS SLA_Met_Count,
    SUM(CASE WHEN SLA_Met = 0 OR SLA_Met = 'False' THEN 1 ELSE 0 END) AS SLA_Breached_Count,
    ROUND(SUM(CASE WHEN SLA_Met = 1 OR SLA_Met = 'True' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS SLA_Compliance_Rate_Pct
FROM tickets
WHERE SLA_Met IS NOT NULL
GROUP BY Priority
ORDER BY SLA_Compliance_Rate_Pct ASC;


-- ------------------------------------------------------------
-- QUERY 7: SLA Breaches by Issue Category
-- Purpose: Identify categories responsible for the most SLA failures.
-- ------------------------------------------------------------
SELECT 
    Category,
    COUNT(*) AS Total_Evaluated,
    SUM(CASE WHEN SLA_Met = 0 OR SLA_Met = 'False' THEN 1 ELSE 0 END) AS SLA_Breaches,
    ROUND(SUM(CASE WHEN SLA_Met = 0 OR SLA_Met = 'False' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS Breach_Rate_Pct
FROM tickets
WHERE SLA_Met IS NOT NULL
GROUP BY Category
ORDER BY SLA_Breaches DESC;


-- ------------------------------------------------------------
-- QUERY 8: Customer Satisfaction (CSAT) by Support Channel
-- Purpose: Compare customer satisfaction ratings across Phone, Chat, Email, and Social Media.
-- ------------------------------------------------------------
SELECT 
    Channel,
    COUNT(Satisfaction_Score) AS Rated_Tickets,
    ROUND(AVG(Satisfaction_Score), 2) AS Avg_CSAT_Score
FROM tickets
WHERE Satisfaction_Score IS NOT NULL
GROUP BY Channel
ORDER BY Avg_CSAT_Score DESC;


-- ------------------------------------------------------------
-- QUERY 9: Customer Satisfaction (CSAT) by Ticket Priority
-- Purpose: Assess customer sentiment based on ticket urgency.
-- ------------------------------------------------------------
SELECT 
    Priority,
    COUNT(Satisfaction_Score) AS Rated_Tickets,
    ROUND(AVG(Satisfaction_Score), 2) AS Avg_CSAT_Score
FROM tickets
WHERE Satisfaction_Score IS NOT NULL
GROUP BY Priority
ORDER BY Avg_CSAT_Score DESC;


-- ------------------------------------------------------------
-- QUERY 10: Multi-Metric Channel Performance Summary
-- Purpose: Comprehensive breakdown of volume, resolution speed, and satisfaction by channel.
-- ------------------------------------------------------------
SELECT 
    Channel,
    COUNT(*) AS Total_Tickets,
    COUNT(Resolution_Hours) AS Resolved_Tickets,
    ROUND(AVG(Resolution_Hours), 2) AS Avg_Resolution_Hours,
    ROUND(AVG(Satisfaction_Score), 2) AS Avg_CSAT_Score
FROM tickets
GROUP BY Channel
ORDER BY Total_Tickets DESC;
