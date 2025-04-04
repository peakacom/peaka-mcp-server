import _ from "lodash";

export const DEFAULT_PEAKA_PARTNER_API_BASE_URL =
  "https://partner.peaka.studio/api/v1/";

export const DEFAULT_PEAKA_DBC_HOST = "https://dbc.peaka.studio:4567";

export const QUERY_GOLDEN_SQL_URL_TEMPLATE = _.template(
  "metadata/<%= projectId %>/golden-sql/query?q=<%= query %>"
);

export const TRANSPILE_TRINO_SQL_URL_TEMPLATE = _.template(
  "sql/transpile/<%= dialect %>"
);

export const PEAKA_SQL_RULE_SET = ` Double check the Trino SQL query above for common mistakes, including:
 -  Include catalog and schema prefices in your queries and wrap catalog and schema prefices with double quotes. Use table aliases. Wrap table names with double quotations if it contains spaces.
 -  Use single quotes for varchar columns.
  - Using NOT IN with NULL values
  - Using UNION when UNION ALL should have been used
  - Using BETWEEN for exclusive ranges
  - Data type mismatch in predicates
  - Properly quoting identifiers
  - Using the correct number of arguments for functions
  - Casting to the correct data type
  - Using the proper columns for joins
  - Misspelling SQL keywords
  - Forgetting Brackets and Quotes
  - Specifying an Invalid Statement Order
  - Omitting Table Aliases
  - Using Case-Sensitive Names
  - Incorrect order when writing queries
  - Using UNION when UNION ALL should have been used
  - Avoid NOT IN or IN and Use JOIN instead
  - Incorrectly Using Wildcard
  - Unbalanced Quotes
  - The OR operator is not applied correctly
  - Missing closing parenthesis in the WHERE clause
  - Using double quotes instead of single quotes to define the string value
  - Using a comma instead of the logical operator "AND" between two conditions in the WHERE clause
  - Mismatched Column Names in JOIN
  - Incorrect Syntax for LIMIT
  - Invalid ORDER BY Column
  - Missing Alias for Subquery
  - Missing AS Keyword in Column Aliasing
  - Do not use an alias defined in the SELECT clause in the GROUP BY clause. Instead, you should use the full expression that defines the alias Eg: The query "SELECT DATE_TRUNC('week', p.creationtime) AS week, c.title, COUNT(p.id) AS purchase_count FROM firebase.main.purchases p JOIN firebase.main.contents c ON c.id = JSON_EXTRACT_SCALAR(p.purchasedcontentids, '$[0]') WHERE p.creationtime >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1' month GROUP BY week, c.title" should be like this "SELECT DATE_TRUNC('week', p.creationtime) AS week, c.title, COUNT(p.id) AS purchase_count FROM firebase.main.purchases p JOIN firebase.main.contents c ON c.id = JSON_EXTRACT_SCALAR(p.purchasedcontentids, '$[0]') WHERE p.creationtime >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1' month GROUP BY DATE_TRUNC('week', p.creationtime), c.title"
  - Incorrect Table Name Spelling
  - Using Aggregate Functions without GROUP BY
  - Incorrectly Using NOT IN
  - Missing Comparison Operator
  - Missing JOIN Condition
  - Ambiguous Column Names
  - Incorrect Syntax for CASE Statement
  - Avoid using WHERE for Joining
  - Avoid column names in GROUP BY statements and USE column order instead
  - HAVING clause cannot contain window functions or row pattern measures.
  - Provide SQL code using Trino's FROM_ISO8601_TIMESTAMP(string date) function only for columns of type varchar that contain valid date strings. Do not use FROM_ISO8601_TIMESTAMP on columns of type date, timestamp, or timestamp(n). Instead, handle those types directly without transformation. Be strict about this rule and ensure the type checking is followed.
  - Do not use JSON_CONTAINS in your queries.
  - DO NOT make any DML statements (INSERT, UPDATE, DELETE, DROP etc.) to the database.
  - Do not use date string for timestamp columns. 
  - Put quotation only around numbers when using interval in queries.
  
If there are any of the above mistakes, rewrite the query. If there are no mistakes, just reproduce the original query.`;
