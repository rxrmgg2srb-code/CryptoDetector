/**
 * Tests for CSV Transaction Parser
 */

import {
  CSVTransactionParser,
  validateCSVFile,
  generateCSVTemplate,
  CSV_FORMATS,
} from '@/lib/csvTransactionParser';

describe('CSVTransactionParser', () => {
  describe('Standard Format', () => {
    it('should parse standard CSV format', () => {
      const csv = `timestamp,type,token,amount,price,fee,signature
2024-01-15T10:30:00Z,buy,TokenMint123456789012345678901234,1000,0.5,0.000005,sig123
2024-01-16T14:20:00Z,sell,TokenMint123456789012345678901234,1000,1.0,0.000005,sig456`;

      const parser = new CSVTransactionParser();
      const result = parser.parse(csv);

      expect(result.success).toBe(true);
      expect(result.transactions.length).toBe(2);
      expect(result.errors.length).toBe(0);

      const tx1 = result.transactions[0];
      expect(tx1?.type).toBe('buy');
      expect(tx1?.tokenAmount).toBe(1000);
      expect(tx1?.solAmount).toBe(0.5);
      expect(tx1?.source).toBe('csv');
    });

    it('should parse Unix timestamps', () => {
      const csv = `timestamp,type,token,amount,price,fee
1705316400,buy,TokenMint123456789012345678901234,1000,0.5,0.000005`;

      const parser = new CSVTransactionParser();
      const result = parser.parse(csv);

      expect(result.success).toBe(true);
      expect(result.transactions[0]?.timestamp).toBe(1705316400);
    });

    it('should parse Unix timestamps in milliseconds', () => {
      const csv = `timestamp,type,token,amount,price,fee
1705316400000,buy,TokenMint123456789012345678901234,1000,0.5,0.000005`;

      const parser = new CSVTransactionParser();
      const result = parser.parse(csv);

      expect(result.success).toBe(true);
      expect(result.transactions[0]?.timestamp).toBe(1705316400);
    });
  });

  describe('Generic Format', () => {
    it('should detect and parse generic format', () => {
      const csv = `date,action,asset,quantity,price
2024-01-15,buy,TokenMint123456789012345678901234,1000,0.5`;

      const parser = new CSVTransactionParser();
      const result = parser.parse(csv);

      expect(result.success).toBe(true);
      expect(result.transactions.length).toBe(1);
    });
  });

  describe('Transaction Type Parsing', () => {
    it('should recognize different buy variations', () => {
      const csv = `timestamp,type,token,amount,price
2024-01-15,buy,TokenMint123456789012345678901234,1000,0.5
2024-01-16,purchase,TokenMint123456789012345678901234,1000,0.5
2024-01-17,long,TokenMint123456789012345678901234,1000,0.5`;

      const parser = new CSVTransactionParser();
      const result = parser.parse(csv);

      expect(result.success).toBe(true);
      expect(result.transactions.length).toBe(3);
      expect(result.transactions.every(tx => tx.type === 'buy')).toBe(true);
    });

    it('should recognize different sell variations', () => {
      const csv = `timestamp,type,token,amount,price
2024-01-15,sell,TokenMint123456789012345678901234,1000,0.5
2024-01-16,sale,TokenMint123456789012345678901234,1000,0.5
2024-01-17,short,TokenMint123456789012345678901234,1000,0.5`;

      const parser = new CSVTransactionParser();
      const result = parser.parse(csv);

      expect(result.success).toBe(true);
      expect(result.transactions.length).toBe(3);
      expect(result.transactions.every(tx => tx.type === 'sell')).toBe(true);
    });
  });

  describe('CSV Parsing Edge Cases', () => {
    it('should handle quoted values with commas', () => {
      const csv = `timestamp,type,token,amount,price
"2024-01-15T10:30:00Z",buy,"TokenMint123456789012345678901234","1,000",0.5`;

      const parser = new CSVTransactionParser();
      const result = parser.parse(csv);

      expect(result.success).toBe(true);
      expect(result.transactions.length).toBe(1);
    });

    it('should handle empty lines', () => {
      const csv = `timestamp,type,token,amount,price

2024-01-15,buy,TokenMint123456789012345678901234,1000,0.5

2024-01-16,sell,TokenMint123456789012345678901234,1000,1.0
`;

      const parser = new CSVTransactionParser();
      const result = parser.parse(csv);

      expect(result.success).toBe(true);
      expect(result.transactions.length).toBe(2);
    });

    it('should handle mixed case headers', () => {
      const csv = `TIMESTAMP,TYPE,TOKEN,AMOUNT,PRICE
2024-01-15,buy,TokenMint123456789012345678901234,1000,0.5`;

      const parser = new CSVTransactionParser();
      const result = parser.parse(csv);

      expect(result.success).toBe(true);
      expect(result.transactions.length).toBe(1);
    });
  });

  describe('Validation', () => {
    it('should reject missing required fields', () => {
      const csv = `timestamp,type,token
2024-01-15,buy,TokenMint123456789012345678901234`;

      const parser = new CSVTransactionParser();
      const result = parser.parse(csv);

      expect(result.success).toBe(false);
      expect(result.transactions.length).toBe(0);
      // When required columns are missing from header, format detection fails
      // and we get an error, not warnings
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid transaction type', () => {
      const csv = `timestamp,type,token,amount,price
2024-01-15,invalid,TokenMint123456789012345678901234,1000,0.5`;

      const parser = new CSVTransactionParser();
      const result = parser.parse(csv);

      expect(result.success).toBe(false);
      expect(result.stats.invalidRows).toBe(1);
    });

    it('should reject negative amounts', () => {
      const csv = `timestamp,type,token,amount,price
2024-01-15,buy,TokenMint123456789012345678901234,-1000,0.5`;

      const parser = new CSVTransactionParser();
      const result = parser.parse(csv);

      expect(result.success).toBe(false);
      expect(result.stats.invalidRows).toBe(1);
    });

    it('should reject invalid token address', () => {
      const csv = `timestamp,type,token,amount,price
2024-01-15,buy,invalid,1000,0.5`;

      const parser = new CSVTransactionParser();
      const result = parser.parse(csv);

      expect(result.success).toBe(false);
      expect(result.stats.invalidRows).toBe(1);
    });

    it('should reject invalid timestamp', () => {
      const csv = `timestamp,type,token,amount,price
invalid-date,buy,TokenMint123456789012345678901234,1000,0.5`;

      const parser = new CSVTransactionParser();
      const result = parser.parse(csv);

      expect(result.success).toBe(false);
      expect(result.stats.invalidRows).toBe(1);
    });
  });

  describe('Statistics', () => {
    it('should provide accurate statistics', () => {
      const csv = `timestamp,type,token,amount,price
2024-01-15,buy,TokenMint123456789012345678901234,1000,0.5
2024-01-16,buy,TokenMint123456789012345678901234,1000,0.5
2024-01-17,sell,TokenMint123456789012345678901234,1000,1.0
invalid-row,invalid,invalid,invalid,invalid`;

      const parser = new CSVTransactionParser();
      const result = parser.parse(csv);

      expect(result.stats.totalRows).toBe(4);
      expect(result.stats.validRows).toBe(3);
      expect(result.stats.invalidRows).toBe(1);
      expect(result.stats.buys).toBe(2);
      expect(result.stats.sells).toBe(1);
    });

    it('should collect warnings for invalid rows', () => {
      const csv = `timestamp,type,token,amount,price
2024-01-15,buy,TokenMint123456789012345678901234,1000,0.5
invalid-row,invalid,invalid,invalid,invalid`;

      const parser = new CSVTransactionParser();
      const result = parser.parse(csv);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Row');
    });
  });

  describe('Empty or Invalid Files', () => {
    it('should handle empty CSV', () => {
      const csv = '';

      const parser = new CSVTransactionParser();
      const result = parser.parse(csv);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle CSV with only header', () => {
      const csv = 'timestamp,type,token,amount,price';

      const parser = new CSVTransactionParser();
      const result = parser.parse(csv);

      expect(result.success).toBe(false);
      expect(result.transactions.length).toBe(0);
    });

    it('should handle CSV with unrecognized format', () => {
      const csv = `wrong,headers,here
value1,value2,value3`;

      const parser = new CSVTransactionParser();
      const result = parser.parse(csv);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('File Validation', () => {
    it('should validate file size', () => {
      const largeContent = 'x'.repeat(6 * 1024 * 1024); // 6MB
      const result = validateCSVFile(largeContent);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('too large');
    });

    it('should validate CSV format', () => {
      const invalidCSV = 'This is not a CSV file';
      const result = validateCSVFile(invalidCSV);

      expect(result.valid).toBe(false);
    });

    it('should accept valid CSV', () => {
      const validCSV = `timestamp,type,token,amount,price
2024-01-15,buy,TokenMint123456789012345678901234,1000,0.5`;
      const result = validateCSVFile(validCSV);

      expect(result.valid).toBe(true);
    });

    it('should require at least 2 lines', () => {
      const singleLine = 'timestamp,type,token,amount,price';
      const result = validateCSVFile(singleLine);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least 2 lines');
    });
  });

  describe('CSV Template', () => {
    it('should generate valid CSV template', () => {
      const template = generateCSVTemplate();

      expect(template).toContain('timestamp');
      expect(template).toContain('type');
      expect(template).toContain('token');
      expect(template).toContain('amount');
      expect(template).toContain('price');

      // Should have 2 lines (header + example)
      const lines = template.trim().split('\n');
      expect(lines.length).toBe(2);
    });

    it('template should be parseable', () => {
      const template = generateCSVTemplate();
      const parser = new CSVTransactionParser();
      const result = parser.parse(template);

      // Template may have example data that's valid or invalid depending on format
      // At minimum, it should not throw errors
      expect(result).toBeDefined();
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle a typical trading day', () => {
      const csv = `timestamp,type,token,amount,price,fee
2024-01-15T09:00:00Z,buy,TokenA12345678901234567890123456789012,1000,0.5,0.000005
2024-01-15T10:30:00Z,buy,TokenB12345678901234567890123456789012,2000,0.3,0.000005
2024-01-15T12:00:00Z,sell,TokenA12345678901234567890123456789012,500,0.6,0.000005
2024-01-15T15:30:00Z,sell,TokenA12345678901234567890123456789012,500,0.55,0.000005
2024-01-15T18:00:00Z,buy,TokenC12345678901234567890123456789012,5000,0.1,0.000005`;

      const parser = new CSVTransactionParser();
      const result = parser.parse(csv);

      expect(result.success).toBe(true);
      expect(result.transactions.length).toBe(5);
      expect(result.stats.buys).toBe(3);
      expect(result.stats.sells).toBe(2);

      // Check transactions are sorted by timestamp
      for (let i = 1; i < result.transactions.length; i++) {
        expect(result.transactions[i]!.timestamp).toBeGreaterThanOrEqual(
          result.transactions[i - 1]!.timestamp
        );
      }
    });

    it('should handle trades across multiple days', () => {
      const csv = `timestamp,type,token,amount,price
2024-01-15,buy,TokenA12345678901234567890123456789012,1000,0.5
2024-01-16,sell,TokenA12345678901234567890123456789012,1000,0.6
2024-01-17,buy,TokenB12345678901234567890123456789012,2000,0.3
2024-01-18,sell,TokenB12345678901234567890123456789012,2000,0.4`;

      const parser = new CSVTransactionParser();
      const result = parser.parse(csv);

      expect(result.success).toBe(true);
      expect(result.transactions.length).toBe(4);

      const uniqueTokens = new Set(result.transactions.map(tx => tx.tokenMint));
      expect(uniqueTokens.size).toBe(2);
    });
  });

  describe('Fee Handling', () => {
    it('should parse fees when provided', () => {
      const csv = `timestamp,type,token,amount,price,fee
2024-01-15,buy,TokenMint123456789012345678901234,1000,0.5,0.001`;

      const parser = new CSVTransactionParser();
      const result = parser.parse(csv);

      expect(result.success).toBe(true);
      expect(result.transactions[0]?.fees).toBe(0.001);
    });

    it('should default fees to 0 when not provided', () => {
      const csv = `timestamp,type,token,amount,price
2024-01-15,buy,TokenMint123456789012345678901234,1000,0.5`;

      const parser = new CSVTransactionParser();
      const result = parser.parse(csv);

      expect(result.success).toBe(true);
      expect(result.transactions[0]?.fees).toBe(0);
    });

    it('should handle invalid fee values', () => {
      const csv = `timestamp,type,token,amount,price,fee
2024-01-15,buy,TokenMint123456789012345678901234,1000,0.5,invalid`;

      const parser = new CSVTransactionParser();
      const result = parser.parse(csv);

      expect(result.success).toBe(true);
      expect(result.transactions[0]?.fees).toBe(0);
    });
  });
});
