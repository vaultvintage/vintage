export interface User {
  id: string;
  email: string;
  username?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  occupation?: string;
  gender?: string;
  residential_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  phone_number?: string | null;
  profile_image?: string | null;
  pin_verified?: boolean;
  is_active?: boolean;
  is_staff?: boolean;
}

export interface Wallet {
  id: number;
  user: string;
  account_number: string;
  balance: string;
  currency: string;
}

export type TxStatus = "PENDING" | "COMPLETED" | "FAILED";

export interface CreditTransaction {
  id: number;
  user: string;
  amount: string;
  description?: string | null;
  status: TxStatus;
  transaction_date: string;
}

export type DebitTransaction = CreditTransaction;

export interface DomesticTransfer {
  id: number;
  amount: string;
  beneficiary_account_name: string;
  beneficiary_account_no: string;
  bank_name: string;
  account_type: string;
  narration: string;
  created_date_time: string;
}

export interface WireTransfer {
  id: number;
  amount: string;
  beneficiary_account_name: string;
  beneficiary_account_no: string;
  bank_name: string;
  select_country: string;
  swift_code: string;
  routing_number?: string;
  account_type: string;
  narration_purpose?: string;
  created_date_time: string;
}

export interface VirtualCard {
  card_number: string;
  expiry_date: string;
  cvv: string;
  card_provider: string;
  user_full_name: string;
  user_address: string;
  user_zipcode: string;
  user_city: string;
  user_state: string;
  user_country: string;
  user_phone_number: string;
}

export interface Loan {
  id?: number;
  borrower_name: string;
  loan_amount: string;
  interest_rate: string;
  loan_term_years: number;
  purpose: string;
  loan_date: string;
  due_date: string;
}

export interface Withdrawal {
  id: number;
  amount: string;
  crypto_type: string;
  wallet_address: string;
  status: TxStatus;
  transaction_date: string;
}

export interface PaymentMethod {
  id: number;
  currency: string;
  network: string;
  qr_image?: string | null;
  wallet_address: string;
  created_at: string;
}
