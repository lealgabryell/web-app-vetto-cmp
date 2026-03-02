/**
 * Remove todos os caracteres não numéricos de uma string.
 * Útil para enviar CPF e Telefone para o backend Java.
 */
export const parseRawNumber = (value: string): string => {
  return value.replace(/\D/g, "");
};

/**
 * Formata CPF: 000.000.000-00
 */
export const formatCPF = (value: string): string => {
  const digits = parseRawNumber(value);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
};

/**
 * Formata Telefone: (00) 00000-0000
 */
export const formatPhone = (value: string): string => {
  const digits = parseRawNumber(value);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");
};