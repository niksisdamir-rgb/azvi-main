import { describe, it, expect } from 'vitest';
import { 
  generateLowStockEmailHTML, 
  generatePurchaseOrderEmailHTML, 
  generateDailyProductionReportHTML 
} from '../lib/email';

describe('Email Template Sanitization', () => {
  const maliciousInput = '<script>alert("xss")</script> & " \'';
  const escapedMaliciousInput = '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; &amp; &quot; &#39;';

  it('should sanitize material names in generateLowStockEmailHTML', () => {
    const html = generateLowStockEmailHTML([{
      name: maliciousInput,
      quantity: 10,
      unit: maliciousInput,
      reorderLevel: 20
    }]);
    
    expect(html).toContain(escapedMaliciousInput);
    expect(html).not.toContain(maliciousInput);
  });

  it('should sanitize all fields in generatePurchaseOrderEmailHTML', () => {
    const html = generatePurchaseOrderEmailHTML({
      id: 123,
      materialName: maliciousInput,
      quantity: 10,
      unit: maliciousInput,
      supplier: maliciousInput,
      orderDate: maliciousInput,
      expectedDelivery: maliciousInput,
      notes: maliciousInput
    });
    
    // Check all fields
    expect(html).toContain(`Dear ${escapedMaliciousInput}`);
    expect(html).toContain(`Material / Materijal:</td>\n          <td style="padding: 8px 0; text-align: right;">${escapedMaliciousInput}</td>`);
    expect(html).toContain(`Quantity / Količina:</td>\n          <td style="padding: 8px 0; text-align: right; font-size: 20px; color: #2563eb;">10 ${escapedMaliciousInput}</td>`);
    expect(html).toContain(`Order Date / Datum narudžbe:</td>\n          <td style="padding: 8px 0; text-align: right;">${escapedMaliciousInput}</td>`);
    expect(html).toContain(`Expected Delivery / Očekivana isporuka:</td>\n          <td style="padding: 8px 0; text-align: right;">${escapedMaliciousInput}</td>`);
    expect(html).toContain(`<p style="background: #fef3c7; padding: 15px; border-radius: 4px; margin: 0;">${escapedMaliciousInput}</p>`);
  });

  it('should sanitize material names and date in generateDailyProductionReportHTML', () => {
    const html = generateDailyProductionReportHTML({
      date: maliciousInput,
      totalConcreteProduced: 100,
      deliveriesCompleted: 5,
      materialConsumption: [{ name: maliciousInput, quantity: 50, unit: maliciousInput }],
      qualityTests: { total: 10, passed: 9, failed: 1 }
    });
    
    expect(html).toContain(escapedMaliciousInput); // Check date
    expect(html).toContain(`<td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${escapedMaliciousInput}</td>`); // Check material name
    expect(html).toContain(`50 ${escapedMaliciousInput}</td>`); // Check unit
  });
});
