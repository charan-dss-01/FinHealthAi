export type BusinessCategory =
  | 'Retail'
  | 'Restaurant'
  | 'Salon'
  | 'Pharmacy'
  | 'Manufacturing'
  | 'Services'
  | 'Freelancer'
  | 'E-commerce'
  | 'Wholesale'
  | 'Other';

export type TransactionType =
  | 'CREDIT'
  | 'DEBIT'
  | 'TRANSFER'
  | 'CASH_WITHDRAWAL'
  | 'CASH_DEPOSIT'
  | 'UNKNOWN';

export type SignalSeverity = 'HIGH' | 'MEDIUM' | 'LOW' | 'POSITIVE';

export type HealthState = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
