/**
 * 📁 CSV Transaction Parser
 * 
 * Parses and validates CSV files containing transaction data.
 * Supports multiple CSV formats (Phantom export, manual entry, etc.)
 */

import { logger } from './logger';
import type { Transaction } from './pnlCalculator';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CSVRow {
  [key: string]: string;
}

export interface ParseResult {
  success: boolean;
  transactions: Transaction[];
  errors: string[];
  warnings: string[];
  stats: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    buys: number;
    sells: number;
  };
}

export interface CSVFormat {
  name: string;
  timestampColumn: string;
  typeColumn: string;
  tokenColumn: string;
  amountColumn: string;
  priceColumn: string;
  feeColumn?: string;
  signatureColumn?: string;
}

// ============================================================================
// PREDEFINED CSV FORMATS
// ============================================================================

export const CSV_FORMATS: { [key: string]: CSVFormat } = {
  // Standard format (our own)
  STANDARD: {
    name: 'Standard',
    timestampColumn: 'timestamp',
    typeColumn: 'type',
    tokenColumn: 'token',
    amountColumn: 'amount',
    priceColumn: 'price',
    feeColumn: 'fee',
    signatureColumn: 'signature',
  },
  
  // Generic format with flexible column names
  GENERIC: {
    name: 'Generic',
    timestampColumn: 'date',
    typeColumn: 'action',
    tokenColumn: 'asset',
    amountColumn: 'quantity',
    priceColumn: 'price',
    feeColumn: 'fee',
  },
  
  // Manual entry format (simple)
  MANUAL: {
    name: 'Manual',
    timestampColumn: 'date',
    typeColumn: 'side',
    tokenColumn: 'token_address',
    amountColumn: 'token_amount',
    priceColumn: 'sol_amount',
  },
};

// ============================================================================
// CSV PARSER
// ============================================================================

export class CSVTransactionParser {
  private format: CSVFormat;
  
  constructor(format?: CSVFormat) {
    this.format = format || (CSV_FORMATS.STANDARD as CSVFormat);
  }
  
  /**
   * Parse CSV content (string) into transactions
   */
  parse(csvContent: string): ParseResult {
    logger.info('📁 Parsing CSV transactions');
    
    const errors: string[] = [];
    const warnings: string[] = [];
    const transactions: Transaction[] = [];
    
    try {
      // Split into lines and parse
      const lines = csvContent.trim().split('\n');
      
      if (lines.length === 0) {
        errors.push('CSV file is empty');
        return this.createResult(transactions, errors, warnings);
      }
      
      // Parse header
      const headerLine = lines[0];
      if (!headerLine) {
        errors.push('CSV header is missing');
        return this.createResult(transactions, errors, warnings);
      }
      
      const headers = this.parseCSVLine(headerLine);
      const format = this.detectFormat(headers);
      
      if (!format) {
        errors.push(`Unable to detect CSV format. Expected columns: ${Object.values(this.format).join(', ')}`);
        return this.createResult(transactions, errors, warnings);
      }
      
      logger.info(`Detected CSV format: ${format.name}`);
      this.format = format;
      
      // Parse data rows
      let validRows = 0;
      let invalidRows = 0;
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i]?.trim();
        if (!line) continue;
        
        try {
          const values = this.parseCSVLine(line);
          const row: CSVRow = {};
          
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          
          const result = this.parseRow(row, i + 1);
          
          if (result.transaction) {
            transactions.push(result.transaction);
            validRows++;
          } else {
            invalidRows++;
            if (result.error) {
              warnings.push(`Row ${i + 1}: ${result.error}`);
            }
          }
        } catch (error) {
          invalidRows++;
          warnings.push(`Row ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      logger.info(`✅ Parsed ${validRows} valid transactions, ${invalidRows} invalid`);
      
    } catch (error) {
      errors.push(`Failed to parse CSV: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    return this.createResult(transactions, errors, warnings);
  }
  
  /**
   * Detect CSV format from headers
   */
  private detectFormat(headers: string[]): CSVFormat | null {
    const lowerHeaders = headers.map(h => h.toLowerCase().trim());
    
    // Try each known format
    for (const format of Object.values(CSV_FORMATS)) {
      const requiredColumns = [
        format.timestampColumn,
        format.typeColumn,
        format.tokenColumn,
        format.amountColumn,
        format.priceColumn,
      ].map(c => c.toLowerCase());
      
      const hasAllRequired = requiredColumns.every(col => 
        lowerHeaders.some(h => h.includes(col) || col.includes(h))
      );
      
      if (hasAllRequired) {
        // Create mapped format with actual column names from original headers
        return {
          ...format,
          timestampColumn: this.findColumn(headers, lowerHeaders, format.timestampColumn) || format.timestampColumn,
          typeColumn: this.findColumn(headers, lowerHeaders, format.typeColumn) || format.typeColumn,
          tokenColumn: this.findColumn(headers, lowerHeaders, format.tokenColumn) || format.tokenColumn,
          amountColumn: this.findColumn(headers, lowerHeaders, format.amountColumn) || format.amountColumn,
          priceColumn: this.findColumn(headers, lowerHeaders, format.priceColumn) || format.priceColumn,
          feeColumn: format.feeColumn ? (this.findColumn(headers, lowerHeaders, format.feeColumn) || undefined) : undefined,
          signatureColumn: format.signatureColumn ? (this.findColumn(headers, lowerHeaders, format.signatureColumn) || undefined) : undefined,
        };
      }
    }
    
    return null;
  }
  
  /**
   * Find actual column name in headers (returns original case)
   */
  private findColumn(headers: string[], lowerHeaders: string[], pattern: string): string | null {
    const patternLower = pattern.toLowerCase();
    const index = lowerHeaders.findIndex(h => 
      h.includes(patternLower) || patternLower.includes(h)
    );
    return index >= 0 ? headers[index] || null : null;
  }
  
  /**
   * Parse a CSV line handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    values.push(currentValue.trim());
    return values;
  }
  
  /**
   * Parse a single CSV row into a Transaction
   */
  private parseRow(row: CSVRow, rowNumber: number): { transaction: Transaction | null; error?: string } {
    try {
      // Extract values
      const timestampStr = row[this.format.timestampColumn];
      const typeStr = row[this.format.typeColumn]?.toLowerCase();
      const tokenMint = row[this.format.tokenColumn];
      const amountStr = row[this.format.amountColumn];
      const priceStr = row[this.format.priceColumn];
      const feeStr = this.format.feeColumn ? row[this.format.feeColumn] : undefined;
      const signature = this.format.signatureColumn ? row[this.format.signatureColumn] : undefined;
      
      // Validate required fields
      if (!timestampStr || !typeStr || !tokenMint || !amountStr || !priceStr) {
        throw new Error('Missing required fields');
      }
      
      // Parse timestamp
      const timestamp = this.parseTimestamp(timestampStr);
      
      // Parse type
      const type = this.parseType(typeStr);
      if (!type) {
        throw new Error(`Invalid transaction type: ${typeStr}`);
      }
      
      // Parse amounts
      const tokenAmount = parseFloat(amountStr);
      const solAmount = parseFloat(priceStr);
      
      if (isNaN(tokenAmount) || isNaN(solAmount)) {
        throw new Error('Invalid amount or price');
      }
      
      if (tokenAmount <= 0 || solAmount <= 0) {
        throw new Error('Amount and price must be positive');
      }
      
      const pricePerToken = solAmount / tokenAmount;
      
      // Parse optional fee
      const fees = feeStr ? parseFloat(feeStr) : 0;
      
      // Validate token mint (basic check)
      if (tokenMint.length < 32 || tokenMint.length > 44) {
        throw new Error('Invalid token address format');
      }
      
      return {
        transaction: {
          timestamp,
          type,
          tokenMint,
          tokenAmount,
          solAmount,
          pricePerToken,
          fees: isNaN(fees) ? 0 : fees,
          source: 'csv',
          signature,
        },
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.warn(`Row ${rowNumber} parsing failed:`, { error: errorMsg });
      return { transaction: null, error: errorMsg };
    }
  }
  
  /**
   * Parse timestamp from various formats
   */
  private parseTimestamp(timestampStr: string): number {
    // Try Unix timestamp first
    const unixTimestamp = parseInt(timestampStr);
    if (!isNaN(unixTimestamp) && unixTimestamp > 1000000000) {
      // If it's in milliseconds, convert to seconds
      return unixTimestamp > 10000000000 ? Math.floor(unixTimestamp / 1000) : unixTimestamp;
    }
    
    // Try ISO date
    const date = new Date(timestampStr);
    if (!isNaN(date.getTime())) {
      return Math.floor(date.getTime() / 1000);
    }
    
    throw new Error('Invalid timestamp format');
  }
  
  /**
   * Parse transaction type from various formats
   */
  private parseType(typeStr: string): 'buy' | 'sell' | null {
    const normalized = typeStr.toLowerCase().trim();
    
    if (normalized === 'buy' || normalized === 'purchase' || normalized === 'long') {
      return 'buy';
    }
    
    if (normalized === 'sell' || normalized === 'sale' || normalized === 'short') {
      return 'sell';
    }
    
    return null;
  }
  
  /**
   * Create result object
   */
  private createResult(
    transactions: Transaction[],
    errors: string[],
    warnings: string[]
  ): ParseResult {
    const buys = transactions.filter(t => t.type === 'buy').length;
    const sells = transactions.filter(t => t.type === 'sell').length;
    
    return {
      success: errors.length === 0 && transactions.length > 0,
      transactions,
      errors,
      warnings,
      stats: {
        totalRows: transactions.length + warnings.length,
        validRows: transactions.length,
        invalidRows: warnings.length,
        buys,
        sells,
      },
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate CSV file size and format
 */
export function validateCSVFile(content: string): { valid: boolean; error?: string } {
  // Check size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (content.length > maxSize) {
    return { valid: false, error: 'CSV file is too large (max 5MB)' };
  }
  
  // Check if it looks like CSV
  const lines = content.split('\n');
  if (lines.length < 2) {
    return { valid: false, error: 'CSV file must have at least 2 lines (header + data)' };
  }
  
  const header = lines[0];
  if (!header || !header.includes(',')) {
    return { valid: false, error: 'Invalid CSV format (no commas in header)' };
  }
  
  return { valid: true };
}

/**
 * Generate CSV template for manual entry
 */
export function generateCSVTemplate(): string {
  const headers = [
    'timestamp',
    'type',
    'token',
    'amount',
    'price',
    'fee',
    'signature',
  ];
  
  const exampleRow = [
    '2024-01-15T10:30:00Z',
    'buy',
    'TokenMint123456789...',
    '1000000',
    '0.5',
    '0.000005',
    'sig123...',
  ];
  
  return `${headers.join(',')}\n${exampleRow.join(',')}`;
}
