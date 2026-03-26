export type AccountType = "CORRENTE" | "POUPANCA" | "SALARIO" | "PAGAMENTO";

export interface FinancialDetails {
  id: string;
  bankCode: string;
  bankName: string;
  agency: string;
  agencyDigit: string;
  accountNumber: string;
  accountVerificationDigit: string;
  accountType: AccountType;
  ownerDocument: string;
  ownerName: string;
  pixKey: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "CLIENT";
  cpf: string;
  birthdate: string;
  phone: string;
  address: Address;
  active: boolean;
  /** Marks ADMIN users who are directors of the company — used for access control and UI filters */
  director: boolean;
  financialDetails?: FinancialDetails;
}

export interface Address {
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
}

export interface FinancialDetailsRequest {
  bankCode?: string;
  bankName?: string;
  agency?: string;
  agencyDigit?: string;
  accountNumber?: string;
  accountVerificationDigit?: string;
  accountType?: AccountType;
  ownerDocument?: string;
  ownerName?: string;
  pixKey?: string;
}

export interface UpdateUserRequest {
  name?: string;
  cpf?: string;
  /** ISO date YYYY-MM-DD */
  birthDate?: string;
  email?: string;
  phone?: string;
  address?: Address;
  financialDetails?: FinancialDetailsRequest;
  director?: boolean;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  cpf: string;
  phone?: string;
  /** ISO date YYYY-MM-DD */
  birthDate?: string;
  role: "ADMIN" | "CLIENT";
  address?: Address;
  financialDetails?: FinancialDetailsRequest;
  director?: boolean;
}
