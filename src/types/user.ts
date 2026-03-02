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

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  address: Address | null;
  birthDate: string; // ISO string
  role: 'ADMIN' | 'CLIENT';
}

export interface UpdateUserRequest {
  name?: string;
  cpf?: string;
  birthDate?: string;
  email?: string;
  phone?: string;
  address?: Address;
}