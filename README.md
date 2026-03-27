# Vetto Contract Manager Platform — Web App

Plataforma web de gestão de contratos corporativos. Permite que administradores criem, acompanhem e gerenciem contratos com clientes, controlem etapas de execução, notificações, reuniões e setores internos. Clientes acessam um portal simplificado para visualizar seus contratos e agenda.

---

## Índice

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Montagem do Ambiente](#3-montagem-do-ambiente)
4. [Variáveis de Ambiente](#4-variáveis-de-ambiente)
5. [Autenticação e Redirecionamento](#5-autenticação-e-redirecionamento)
6. [Perfis de Usuário e Modelo de Permissões](#6-perfis-de-usuário-e-modelo-de-permissões)
7. [Mapa de Rotas](#7-mapa-de-rotas)
8. [Fluxos Principais](#8-fluxos-principais)
9. [Componentes e Responsabilidades](#9-componentes-e-responsabilidades)
10. [Sistema de Notificações](#10-sistema-de-notificações)
11. [Referência de `data-test-id`](#11-referência-de-data-test-id)
12. [Endpoints de API Consumidos](#12-endpoints-de-api-consumidos)

---

## 1. Visão Geral do Projeto

| Item | Detalhe |
|---|---|
| **Nome do pacote** | `vetto-contract-manager-platform` |
| **Versão** | `0.1.0` |
| **Framework** | Next.js 16 (App Router) |
| **Porta padrão** | `3000` |
| **Backend esperado** | `http://localhost:8080` (configurável via env) |

A aplicação é dividida em dois portais distintos que compartilham o mesmo servidor Next.js:

- **Portal Admin** (`/admin/*`) — Para usuários com `role = ADMIN`. Gestão completa de contratos, etapas, setores, agenda e perfil.
- **Portal Cliente** (`/home`, `/agenda`) — Para usuários com `role = CLIENT`. Visualização de contratos e agenda pessoal.

---

## 2. Stack Tecnológica

| Categoria | Biblioteca / Versão |
|---|---|
| Framework | Next.js 16.1.6 |
| React | 19.2.3 |
| Linguagem | TypeScript 5 |
| Estilização | Tailwind CSS 4 |
| Ícones | Lucide React 0.563 |
| HTTP Client | Axios 1.13 |
| State / Cache | TanStack React Query 5 |
| Componentes Headless | Radix UI 1.4, shadcn/ui |
| Calendário | React Day Picker 9 |
| Cookies | js-cookie 3 |
| Toasts | react-hot-toast 2 |
| Datas | date-fns 4 |
| Linting | ESLint 9 + eslint-config-next |

---

## 3. Montagem do Ambiente

### Pré-requisitos

- Node.js **18+** (recomendado LTS 20)
- npm, yarn, pnpm ou bun
- Backend da plataforma rodando (ver [Variáveis de Ambiente](#4-variáveis-de-ambiente))

### Passo a passo

```bash
# 1. Clonar o repositório
git clone <url-do-repositorio>
cd web-app-vetto-cmp

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com os valores corretos (ver seção 4)

# 4. Iniciar em modo desenvolvimento
npm run dev
```

A aplicação estará disponível em **http://localhost:3000**.

### Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia servidor de desenvolvimento com hot-reload |
| `npm run build` | Gera build de produção |
| `npm run start` | Inicia o servidor a partir do build de produção |
| `npm run lint` | Executa ESLint |

---

## 4. Variáveis de Ambiente

Criar o arquivo `.env.local` na raiz do projeto:

```env
# URL base da API REST do backend
NEXT_PUBLIC_API_URL=http://localhost:8080
```

> Se `NEXT_PUBLIC_API_URL` não for definida, o sistema usa `http://localhost:8080` como fallback.

---

## 5. Autenticação e Redirecionamento

### Mecanismo

- O login retorna um **JWT** e o **role** do usuário.
- Ambos são armazenados em cookies: `user_token` (expira em 2 dias) e `user_role`.
- Todas as requisições ao backend incluem o header `Authorization: Bearer <token>` automaticamente via interceptor do Axios.
- Se o backend retornar `401` com mensagem `"Token expirado"`, os cookies são removidos e o usuário é redirecionado para `/login`.

### Middleware de roteamento (`src/proxy.ts`)

O middleware Next.js é aplicado em **todas** as rotas (exceto arquivos estáticos e `/api`) e executa as seguintes regras:

| Condição | Ação |
|---|---|
| Sem token + rota privada | Redireciona para `/login` |
| Com token + acessa `/login` | Redireciona para `/admin` (ADMIN) ou `/home` (CLIENT) |
| Com token + rota privada | Deixa passar |

### Rota raiz (`/`)

A página raiz lê os cookies no servidor e redireciona:
- Sem token → `/login`
- `role = ADMIN` → `/admin`
- Qualquer outro role → `/home`

---

## 6. Perfis de Usuário e Modelo de Permissões

### Roles do sistema

| Role | Descrição |
|---|---|
| `ADMIN` | Colaborador interno. Acessa o portal de administração. |
| `CLIENT` | Cliente externo. Acessa apenas o portal do cliente. |

### Distinção dentro do role ADMIN

| Flag | Significado |
|---|---|
| `director = true` | Diretor da empresa. Possui permissões máximas: criar setores, desativar usuários, editar dados financeiros de qualquer cliente, criar perfis de usuário. |
| `director = false` | Admin comum. Permissões dependem do papel no setor (LEADER ou MEMBER). |

### Papéis dentro de um Setor (CompanySection)

| Papel no Setor | Permissões |
|---|---|
| `LEADER` | Pode editar o setor, adicionar membros MEMBERs, remover MEMBERs, ver detalhes completos dos contratos da categoria do setor, editar dados financeiros de clientes do contrato. |
| `MEMBER` | Visualização resumida dos contratos da categoria do setor. Não pode editar o setor nem gerenciar etapas. |

### Matriz de permissões por funcionalidade

| Funcionalidade | CLIENT | ADMIN MEMBER | ADMIN LEADER | ADMIN DIRECTOR |
|---|---|---|---|---|
| Ver lista de contratos | ✅ (sem DRAFT) | ✅ | ✅ | ✅ |
| Ver detalhes completos do contrato | ❌ | ❌ | ✅ | ✅ |
| Criar contrato | ❌ | ❌ | ✅ | ✅ |
| Editar contrato | ❌ | ❌ | ✅ | ✅ |
| Cancelar contrato | ❌ | ❌ | ✅ | ✅ |
| Gerenciar etapas | ❌ | ❌ | ✅ | ✅ |
| Aprovar etapa | ❌ | Apenas se for aprovador da etapa | ✅ | ✅ |
| Upload de PDF (etapa/contrato) | ❌ | ❌ | ✅ | ✅ |
| Ver dados financeiros do cliente | ❌ | ❌ | ✅ | ✅ |
| Editar dados financeiros do cliente | ❌ | ❌ | ✅ | ✅ |
| Criar setor | ❌ | ❌ | ❌ | ✅ |
| Editar setor (nome, categorias) | ❌ | ❌ | ✅ (do próprio setor) | ✅ |
| Adicionar membro ao setor | ❌ | ❌ | ✅ (MEMBERs) | ✅ (qualquer) |
| Remover membro do setor | ❌ | ❌ | ✅ (MEMBERs) | ✅ |
| Desativar usuário no sistema | ❌ | ❌ | ❌ | ✅ |
| Criar novo perfil de usuário | ❌ | ❌ | ❌ | ✅ |
| Editar próprio perfil | ✅ | ✅ | ✅ | ✅ |
| Ver agenda (reuniões) | ✅ | ✅ | ✅ | ✅ |
| Confirmar reunião | ❌ | ✅ | ✅ | ✅ |
| Análise de IA (Vetto) | ❌ | ❌ | ✅ | ✅ |

### Como o acesso ao contrato é determinado

1. O backend associa automaticamente admins a contratos com base nas **categorias dos setores** a que pertencem.
2. Admins com `canViewDetails = true` na associação do contrato são considerados **LEADER** para aquele contrato.
3. Admins com `canViewDetails = false` são **MEMBER** — veem o card mas não os detalhes internos.
4. Qualquer admin `director` sempre tem `canViewDetails = true`.

---

## 7. Mapa de Rotas

### Rotas públicas

| Rota | Arquivo | Responsabilidade |
|---|---|---|
| `/login` | `src/app/login/page.tsx` | Formulário de autenticação. Redireciona após login com base no role. |

### Rota raiz

| Rota | Arquivo | Responsabilidade |
|---|---|---|
| `/` | `src/app/page.tsx` | Server component. Lê cookies e redireciona para `/login`, `/admin` ou `/home`. |

### Portal Admin (`role = ADMIN`)

Todas as rotas abaixo são filhas do layout `src/app/(administration)/layout.tsx`, que renderiza o `AdminHeader` com navegação, sino de notificações e botão de logout.

| Rota | Arquivo | Responsabilidade |
|---|---|---|
| `/admin` | `src/app/(administration)/admin/page.tsx` | **Dashboard de Contratos.** Lista contratos agrupados por categoria, com filtros de busca e status. Abre modais de detalhe, etapas, edição e criação. |
| `/admin/agenda` | `src/app/(administration)/admin/agenda/page.tsx` | **Agenda Admin.** Calendário visual de reuniões com clientes. Permite confirmar reuniões e adicionar notas privadas. |
| `/admin/companySections` | `src/app/(administration)/admin/companySections/page.tsx` | **Setores.** Lista os setores aos quais o admin pertence. Diretores podem criar setores e gerenciar membros. |
| `/admin/profile` | `src/app/(administration)/admin/profile/page.tsx` | **Perfil Admin.** Visualização e edição dos dados pessoais e endereço do admin logado. Diretores podem criar novos perfis de usuário. |

### Portal Cliente (`role = CLIENT`)

| Rota | Arquivo | Responsabilidade |
|---|---|---|
| `/home` | `src/app/(client)/home/page.tsx` | **Portal do Cliente.** Lista os contratos vinculados ao cliente (exceto DRAFT), com status, datas e valor. Links para download de PDFs. |
| `/agenda` | `src/app/(client)/agenda/page.tsx` | **Agenda Cliente.** Stub de página — ainda em desenvolvimento. |

---

## 8. Fluxos Principais

### 8.1 Login

```
Usuário acessa qualquer URL
  └─ Middleware verifica cookie user_token
       ├─ Sem token → /login
       └─ Com token → /admin ou /home

Na página /login:
  1. Usuário preenche e-mail e senha
  2. POST /auth/login
  3. Backend retorna { token, role }
  4. Cookies user_token e user_role são gravados (expiram em 2 dias)
  5. Redirecionamento:
       role = ADMIN → /admin
       qualquer outro → /home
```

### 8.2 Visualização e Gestão de Contratos (Admin)

```
/admin carrega:
  1. GET /api/contracts → lista de contratos
  2. Em background: GET /api/users/admins + GET /api/contracts/categories
  3. Contratos agrupados por categoria, todos retraídos por padrão

Clique em um contrato:
  ├─ canViewDetails = true (LEADER/DIRECTOR)
  │    → Modal completo: título, status, cliente, PDFs, botões de ação
  │    → Botão "Gerenciar Etapas" → painel de etapas
  │    → Botão "Cancelar Contrato" → confirmação → PATCH /cancel
  │    → Ícone de lápis → EditContractModal
  │    → Análise Vetto → VettoAnalysisModal
  │    → Clique no nome do cliente → mini-modal de dados financeiros
  └─ canViewDetails = false (MEMBER)
       → Modal resumido: título, status, cliente, período, valor
       → Sem ações de edição/cancelamento
```

### 8.3 Gestão de Etapas

```
Dentro do modal do contrato (apenas LEADER/DIRECTOR):
  1. Botão "Gerenciar Etapas" → GET /api/contracts/{id}/steps
  2. Lista de etapas filtráveis por título e status
  3. Ações por etapa:
       - Alterar status → PATCH /api/contracts/{id}/steps/{stepId}/status
       - Editar → EditStepModal → PUT /api/contracts/{id}/steps/{stepId}
       - Upload PDF → POST /api/contracts/{id}/steps/{stepId}/pdf
       - Aprovar → PATCH /api/contracts/{id}/steps/{stepId}/approve
         (apenas se o usuário logado for um dos aprovadores da etapa)
       - Solicitar aprovação → cria notificações para todos os aprovadores pendentes
  4. Botão "+ Nova Etapa" → NewStepForm → POST /api/contracts/{id}/steps
```

### 8.4 Criação de Contrato

```
Botão "Novo Contrato" (disponível para qualquer ADMIN):
  1. NewContractModal abre
  2. Preenchimento: título, descrição, categoria, cliente (busca por CPF),
     datas, valor, configuração de recorrência de pagamento
  3. POST /api/contracts
  4. Lista de contratos é recarregada via GET /api/contracts
```

### 8.5 Dados Financeiros do Cliente

```
Clique no nome do cliente no modal do contrato:
  1. GET /api/users/{clientId}
  2. Mini-modal exibe dados bancários do cliente

Editar dados financeiros (apenas LEADER do contrato ou DIRECTOR):
  ├─ Se já existe financialDetails.id:
  │    PATCH /api/financial-details/{id}
  └─ Se não existe:
       PUT /api/users/{userId} com { financialDetails: {...} }
```

### 8.6 Setores (CompanySections)

```
/admin/companySections carrega:
  GET /api/users/me
  GET /api/company-sections
  GET /api/contracts/categories
  GET /api/users/admins

Todos os setores onde o admin é membro são exibidos.
Cada setor mostra: nome, categorias vinculadas, lista de membros.

LEADER do setor:
  - Editar nome e categorias → PATCH /api/company-sections/{id}
  - Adicionar membros → POST /api/company-sections/{id}/members
  - Remover MEMBERs → DELETE /api/company-sections/{id}/members/{userId}

DIRECTOR:
  - Tudo do LEADER +
  - Criar setor → POST /api/company-sections
  - Remover qualquer membro (incluindo outros LEADERs)
  - Desativar usuário no sistema → PATCH /api/users/{userId}/deactivate
```

### 8.7 Notificações

```
NotificationBell (no header, apenas para admins):
  - Polling de não lidas: GET /api/notifications/unread
  - Clique no sino: GET /api/notifications (todas)
  - Clique em uma notificação:
      1. PATCH /api/notifications/{id}/read
      2. Dispara evento CustomEvent 'open-step-modal' no window
      3. O Dashboard escuta esse evento e abre o painel de etapas do contrato correspondente
  - "Marcar todas como lidas": PATCH /api/notifications/read-all
```

### 8.8 Perfil do Admin

```
/admin/profile carrega:
  GET /api/users/me → dados pessoais
  GET /api/company-sections → setores do usuário (background)

Editar perfil:
  1. Botão "Editar Perfil" exibe o formulário inline
  2. PUT /api/users/{userId} com campos não-vazios
  3. Campos: nome, CPF, data de nascimento, telefone, endereço completo
  4. E-mail é readonly (não pode ser alterado pela UI)

Criar novo perfil (apenas DIRECTOR):
  - Botão "Criar novo perfil" → NewUserAdminModal
  - POST /api/users com nome, e-mail, senha, CPF, role, etc.
```

### 8.9 Análise Vetto (IA)

```
No modal de detalhes do contrato (LEADER/DIRECTOR):
  VettoTrigger → botão de análise de IA
  Clique → VettoAnalysisModal abre
  Exibe: aiRiskScore, aiAnalysisSummary, keyClauses extraídas automaticamente
  (A análise é gerada pelo backend e armazenada no contrato)
```

---

## 9. Componentes e Responsabilidades

### Layout

| Componente | Responsabilidade |
|---|---|
| `AdminHeader` | Barra de navegação superior fixa. Links para Contratos, Agenda, Setores, Perfil. Sino de notificações e botão de logout. |

### Contratos

| Componente | Responsabilidade |
|---|---|
| `ContractRowItem` | Card compacto de contrato dentro de uma categoria. Exibe título, cliente, status e datas. Abre o modal ao clicar. |
| `NewContractModal` | Formulário completo de criação de contrato com lookup de cliente por CPF. |
| `EditContractModal` | Formulário de edição de todos os campos do contrato. |
| `StepItem` | Card de uma etapa com seletor de status, ações de aprovação, upload de PDF e edição. |
| `NewStepForm` | Formulário inline de criação de etapa. |
| `EditStepModal` | Modal de edição completa de uma etapa. |
| `StatusBadge` | Badge colorido de status de contrato (DRAFT, ACTIVE, SUSPENDED, FINISHED, CANCELED). |
| `FileUpload` | Componente de upload de PDF (SCANNED ou FINAL) para o contrato. |
| `FileView` | Exibe links para os PDFs associados ao contrato. |
| `VettoTrigger` | Botão de acesso à análise de IA do contrato. |
| `VettoModal` | Modal de visualização do resultado da análise de IA. |

### Setores

| Componente | Responsabilidade |
|---|---|
| `SectionCard` | Card de um setor com cabeçalho recolhível, lista de membros e formulário de edição inline. |
| `SectionEditForm` | Formulário inline para editar nome, categorias e adicionar membros a um setor. |
| `SectionMemberList` | Lista ordenada de membros de um setor. |
| `SectionMemberItem` | Item de membro com ações de remover (LEADER/DIRECTOR) e desativar (DIRECTOR). |
| `SectionSearchBar` | Campo de busca de setores por nome ou membro. |
| `CreateSectionModal` | Modal de criação de novo setor com categorias e membros iniciais. |

### Notificações

| Componente | Responsabilidade |
|---|---|
| `NotificationBell` | Ícone de sino com badge de contagem de não lidas. |
| `NotificationDropdown` | Painel dropdown com lista de notificações. |
| `NotificationItem` | Item de notificação clicável. Ao clicar, marca como lida e navega até a etapa relacionada. |

### Scheduling (Agenda)

| Componente | Responsabilidade |
|---|---|
| `CalendarView` | Visualização de calendário mensal de reuniões. |
| `MeetingList` | Lista de reuniões de um período. |
| `ScheduleDashboard` | Orquestra CalendarView e MeetingList. |

### Users

| Componente | Responsabilidade |
|---|---|
| `NewUserAdminModal` | Modal de criação de novo usuário (ADMIN ou CLIENT). Exclusivo para DIRECTOR. |
| `ClientSelector` | Componente de busca e seleção de cliente por CPF. Usado na criação de contratos. |

---

## 10. Sistema de Notificações

### Tipos de Notificação

| Tipo | Quando é gerada |
|---|---|
| `ATRIBUIDO_RESPONSAVEL` | Um admin é definido como responsável por uma etapa |
| `ATRIBUIDO_APROVADOR` | Um admin é definido como aprovador de uma etapa |
| `ETAPA_APROVADA` | Um aprovador individual registra sua aprovação |
| `ETAPA_TOTALMENTE_APROVADA` | Todos os aprovadores de uma etapa aprovaram |
| `APROVACAO_SOLICITADA` | Um responsável envia pedido de aprovação para os aprovadores pendentes |

### Fluxo de deep-link

Ao clicar em uma notificação relacionada a uma etapa:
1. A notificação é marcada como lida.
2. Um evento global `open-step-modal` é disparado no `window` com `{ contractId, contractStepId }`.
3. O Dashboard de Contratos escuta esse evento e abre automaticamente o painel de etapas do contrato correto.

---

## 11. Referência de `data-test-id`

Todos os elementos interativos das páginas possuem atributos `data-test-id` para automação de testes de GUI.

### Página: `/login`

| `data-test-id` | Elemento | Ação |
|---|---|---|
| *(a implementar)* | Input e-mail | Campo de e-mail |
| *(a implementar)* | Input senha | Campo de senha |
| *(a implementar)* | Botão submit | Submeter login |

### Página: `/admin` — Dashboard de Contratos

| `data-test-id` | Elemento | Ação |
|---|---|---|
| `btn-new-contract` | Botão "Novo Contrato" | Abre modal de criação |
| `input-contract-search` | Input de busca | Filtra contratos por título ou cliente |
| `select-contract-status-filter` | Select de status | Filtra contratos por status |
| `btn-clear-contract-filters` | Botão "Limpar filtros" | Remove filtros de busca |
| `btn-toggle-category-{nome}` | Botão de categoria | Expande/recolhe grupo de categoria |
| **— Modal do Contrato (LEADER/DIRECTOR) —** | | |
| `btn-edit-contract` | Ícone de lápis | Abre modal de edição do contrato |
| `btn-open-client-details` | Nome do cliente | Abre mini-modal de dados financeiros |
| `btn-manage-steps` | Botão "Gerenciar Etapas" | Navega para painel de etapas |
| `btn-cancel-contract` | Botão "Cancelar Contrato" | Exibe confirmação de cancelamento |
| `btn-confirm-cancel-contract` | Botão "Sim, cancelar" | Confirma o cancelamento |
| `btn-dismiss-cancel-contract` | Botão "Não, voltar" | Descarta a confirmação |
| `btn-close-contract-modal` | Botão "Fechar" | Fecha o modal do contrato |
| **— Modal do Contrato (MEMBER) —** | | |
| `btn-open-client-details-member` | Nome do cliente | Abre mini-modal de dados financeiros |
| **— Painel de Etapas —** | | |
| `btn-back-to-contract-details` | Botão "← Voltar" | Retorna aos detalhes do contrato |
| `btn-new-step` | Botão "+ Nova Etapa" | Abre formulário de criação de etapa |
| `input-step-search` | Input de busca | Filtra etapas por título |
| `select-step-status-filter` | Select de status | Filtra etapas por status |
| `btn-clear-step-filters` | Botão "Limpar filtros" | Remove filtros de etapas |
| **— Mini-modal Dados Financeiros —** | | |
| `btn-close-client-details` | Botão ✕ | Fecha o mini-modal |
| `btn-edit-financial` | Botão "Editar dados financeiros" | Exibe formulário de edição |
| `input-bank-code` | Input Cód. Banco | Código bancário (até 4 dígitos) |
| `input-bank-name` | Input Nome do Banco | Nome do banco |
| `input-agency` | Input Agência | Número da agência |
| `input-agency-digit` | Input Dígito Agência | Dígito verificador |
| `input-account-number` | Input Nº da Conta | Número da conta |
| `input-account-digit` | Input Dígito Conta | Dígito verificador da conta |
| `select-account-type` | Select Tipo de conta | CORRENTE / POUPANCA / SALARIO / PAGAMENTO |
| `input-owner-name` | Input Titular | Nome do titular |
| `input-owner-document` | Input CPF/CNPJ | Documento do titular |
| `input-pix-key` | Input Chave PIX | Chave PIX |
| `btn-save-financial` | Botão "Salvar" | Salva dados financeiros |
| `btn-cancel-financial-edit` | Botão "Cancelar" | Descarta edição financeira |

### Página: `/admin/companySections` — Setores

| `data-test-id` | Elemento | Ação |
|---|---|---|
| `btn-create-section` | Botão "Criar novo Setor" | Abre modal de criação (apenas DIRECTOR) |
| `input-section-search` | Input de busca | Filtra setores por nome ou membro |
| `btn-clear-section-search-inline` | Botão ✕ dentro do input | Limpa busca inline |
| `btn-clear-section-search` | Botão "Limpar busca" | Limpa busca (abaixo do input) |
| `btn-toggle-section-{id}` | Botão com contador | Expande/recolhe membros do setor |
| `btn-edit-section-{id}` | Botão "Editar" | Abre formulário de edição inline |
| `btn-cancel-edit-section` | Botão "Cancelar" | Cancela edição do setor |
| `btn-save-edit-section` | Botão "Salvar" | Salva edições do setor |
| **— Formulário de Edição inline —** | | |
| `input-edit-section-name` | Input nome do setor | Edita nome do setor |
| `input-edit-category` | Input categoria | Digitar nova categoria |
| `btn-add-category` | Botão "Adicionar" | Adiciona categoria à lista |
| `btn-remove-category-{cat}` | Botão trash de categoria | Remove categoria da lista |
| `input-edit-member-search` | Input busca de membro | Filtra admins para adicionar |
| `select-adding-member-role` | Select de role | Define role do membro a adicionar |
| `select-staged-member-role-{userId}` | Select de role no membro staged | Altera role antes de salvar |
| `btn-remove-staged-member-{userId}` | Botão ✕ do membro staged | Remove membro da fila de adição |
| `btn-add-member-{userId}` | Item da lista de sugestões | Adiciona membro à fila |
| **— Lista de Membros —** | | |
| `btn-remove-member-{userId}` | Botão "Remover" | Remove membro do setor |
| `btn-deactivate-member-{userId}` | Botão "Desativar" | Desativa usuário no sistema (DIRECTOR) |
| **— Modal Criar Setor —** | | |
| `btn-close-create-section-modal` | Botão ✕ | Fecha o modal |
| `input-create-section-name` | Input nome | Nome do novo setor |
| `input-create-category-search` | Input categoria | Pesquisa categoria existente |
| `btn-remove-new-category-{cat}` | Botão trash | Remove categoria da lista |
| `btn-select-new-category-{cat}` | Item de sugestão | Seleciona categoria sugerida |
| `input-create-member-search` | Input busca | Filtra admins para adicionar |
| `select-new-member-role-{userId}` | Select de role | Altera role do membro |
| `btn-remove-new-member-{userId}` | Botão ✕ | Remove membro da lista |
| `btn-add-new-member-{userId}` | Item de sugestão | Adiciona admin à lista |
| `btn-cancel-create-section` | Botão "Cancelar" | Fecha o modal sem salvar |
| `btn-confirm-create-section` | Botão "Criar Setor" | Confirma a criação |

### Página: `/admin/profile` — Perfil

| `data-test-id` | Elemento | Ação |
|---|---|---|
| `btn-create-new-profile` | Botão "Criar novo perfil" | Abre modal de criação (apenas DIRECTOR) |
| `btn-edit-profile` | Botão "Editar Perfil" | Exibe formulário de edição |
| `btn-cancel-edit-profile` | Botão "Cancelar" | Descarta edição do perfil |
| `btn-save-profile` | Botão "Salvar" | Salva alterações do perfil |
| `input-profile-name` | Input nome completo | Edita nome |
| `input-profile-email` | Input e-mail (readonly) | Exibe e-mail (não editável) |
| `input-profile-cpf` | Input CPF | Edita CPF |
| `input-profile-birth-date` | Input data de nascimento | Edita data de nascimento |
| `input-profile-phone` | Input telefone | Edita telefone |
| `input-profile-street` | Input rua | Edita logradouro |
| `input-profile-number` | Input número | Edita número do endereço |
| `input-profile-complement` | Input complemento | Edita complemento |
| `input-profile-neighborhood` | Input bairro | Edita bairro |
| `input-profile-zip-code` | Input CEP | Edita CEP |
| `input-profile-city` | Input cidade | Edita cidade |
| `input-profile-state` | Input estado (UF) | Edita UF (máx. 2 caracteres, uppercase) |

---

## 12. Endpoints de API Consumidos

> **Convenções:**
> - Campos marcados com `*` são obrigatórios no payload.
> - Tipos `string (UUID)` indicam identificadores gerados pelo backend.
> - Datas seguem o formato `YYYY-MM-DD` salvo quando especificado como ISO 8601.
> - Todos os endpoints (exceto `/auth/login`) exigem o header `Authorization: Bearer <token>`.

---

### 12.1 Autenticação

---

#### `POST /auth/login`

**Payload:**
```json
{
  "email": "admin@empresa.com",   // * string
  "password": "senha123"          // * string
}
```

**Response `200`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // JWT
  "role": "ADMIN"                                        // "ADMIN" | "CLIENT"
}
```

**Erros comuns:** `401` / `403` → credenciais inválidas.

---

### 12.2 Usuários

---

#### `GET /api/users/me`

Sem payload. Retorna os dados do usuário dono do token.

**Response `200` — Objeto `User`:**
```json
{
  "id": "uuid",
  "name": "João Silva",
  "email": "joao@empresa.com",
  "password": "[hash oculto]",
  "role": "ADMIN",               // "ADMIN" | "CLIENT"
  "cpf": "12345678901",
  "birthdate": "1990-05-15",
  "phone": "21999999999",
  "active": true,
  "director": false,
  "address": {
    "street": "Rua das Flores",
    "number": "42",
    "complement": "Apto 3",
    "neighborhood": "Centro",
    "city": "Rio de Janeiro",
    "state": "RJ",
    "zipCode": "20040-020"
  },
  "financialDetails": {           // null se não cadastrado
    "id": "uuid",
    "bankCode": "001",
    "bankName": "Banco do Brasil",
    "agency": "1234",
    "agencyDigit": "5",
    "accountNumber": "000123456",
    "accountVerificationDigit": "7",
    "accountType": "CORRENTE",    // "CORRENTE"|"POUPANCA"|"SALARIO"|"PAGAMENTO"
    "ownerDocument": "12345678901",
    "ownerName": "João Silva",
    "pixKey": "joao@empresa.com"
  }
}
```

---

#### `GET /api/users/{id}`

Sem payload. Retorna o `User` completo do ID informado (mesmo schema acima).

---

#### `GET /api/users/cpf/{cpf}`

Sem payload. Retorna o `User` com o CPF informado, ou `404` se não encontrado.

---

#### `GET /api/users/admins`

Sem payload.

**Response `200` — Array de `User`:**
```json
[
  { /* User */ },
  { /* User */ }
]
```

---

#### `POST /api/users`

**Payload — `CreateUserRequest`:**
```json
{
  "name": "Maria Souza",          // *
  "email": "maria@cliente.com",   // *
  "password": "senhaSegura123",   // *
  "cpf": "98765432100",           // *
  "role": "CLIENT",               // * "ADMIN" | "CLIENT"
  "phone": "11988887777",
  "birthDate": "1985-08-20",      // YYYY-MM-DD
  "director": false,
  "address": {
    "street": "Av. Paulista",
    "number": "1000",
    "complement": "",
    "neighborhood": "Bela Vista",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01310-100"
  },
  "financialDetails": {
    "bankCode": "033",
    "bankName": "Santander",
    "agency": "0001",
    "agencyDigit": "9",
    "accountNumber": "123456789",
    "accountVerificationDigit": "0",
    "accountType": "CORRENTE",
    "ownerDocument": "98765432100",
    "ownerName": "Maria Souza",
    "pixKey": "98765432100"
  }
}
```

**Response `201` — `User` criado** (mesmo schema de `GET /api/users/me`).

---

#### `PUT /api/users/{id}`

**Payload — `UpdateUserRequest`** (todos os campos são opcionais; campos vazios são omitidos):
```json
{
  "name": "João Silva Atualizado",
  "cpf": "12345678901",
  "birthDate": "1990-05-15",
  "email": "novo@email.com",
  "phone": "21988887766",
  "director": false,
  "address": {
    "street": "Rua Nova",
    "number": "100",
    "complement": "Casa",
    "neighborhood": "Tijuca",
    "city": "Rio de Janeiro",
    "state": "RJ",
    "zipCode": "20510-060"
  },
  "financialDetails": {
    "bankCode": "341",
    "bankName": "Itaú",
    "agency": "0001",
    "agencyDigit": "X",
    "accountNumber": "000987654",
    "accountVerificationDigit": "3",
    "accountType": "POUPANCA",
    "ownerDocument": "12345678901",
    "ownerName": "João Silva",
    "pixKey": "12345678901"
  }
}
```

**Response `200` — `User` atualizado.**

---

#### `PATCH /api/users/{id}/deactivate`

Sem payload. Desativa o usuário (seta `active = false`).

**Response `200` ou `204`** — sem corpo.

---

#### `PATCH /api/users/{id}/financial-details/{detailsId}`

Sem payload. Vincula um registro de `FinancialDetails` já existente a um usuário.

**Response `200` — `User` atualizado.**

---

### 12.3 Detalhes Financeiros

---

#### `GET /api/financial-details?accountNumber={n}`

Sem payload. Query param: `accountNumber` (string).

**Response `200` — `FinancialDetails`:**
```json
{
  "id": "uuid",
  "bankCode": "001",
  "bankName": "Banco do Brasil",
  "agency": "1234",
  "agencyDigit": "5",
  "accountNumber": "000123456",
  "accountVerificationDigit": "7",
  "accountType": "CORRENTE",
  "ownerDocument": "12345678901",
  "ownerName": "João Silva",
  "pixKey": "joao@empresa.com"
}
```

---

#### `PATCH /api/financial-details/{id}`

**Payload — `FinancialDetailsRequest`** (todos opcionais — apenas campos enviados são atualizados):
```json
{
  "bankCode": "341",
  "bankName": "Itaú",
  "agency": "0001",
  "agencyDigit": "X",
  "accountNumber": "000987654",
  "accountVerificationDigit": "3",
  "accountType": "CORRENTE",
  "ownerDocument": "12345678901",
  "ownerName": "João Silva",
  "pixKey": "joao@novo.com"
}
```

**Response `200` — `FinancialDetails` atualizado.**

---

### 12.4 Contratos

---

#### `GET /api/contracts`

Sem payload.

**Response `200` — Array de `ContractResponse`:**
```json
[
  {
    "id": "uuid",
    "title": "Projeto Alpha",
    "description": "Desenvolvimento de sistema web",
    "status": "ACTIVE",           // "DRAFT"|"ACTIVE"|"SUSPENDED"|"FINISHED"|"CANCELED"
    "totalValue": 150000.00,
    "startDate": "2026-01-01",
    "endDate": "2026-12-31",
    "clientId": "uuid",
    "clientName": "Empresa Beta Ltda",
    "clientEmail": "contato@beta.com",
    "scannedContractUrl": "https://storage.exemplo.com/contrato_alpha.pdf",
    "finalProjectUrl": null,
    "category": "TECNOLOGIA",
    "aiRiskScore": 7.5,
    "aiAnalysisSummary": "Contrato com cláusulas de rescisão favoráveis...",
    "autoExtracted": true,
    "keyClauses": ["Multa rescisória de 10%", "Entrega em 30 dias"],
    "recorrencia": true,
    "tipoRecorrencia": "MENSAL",  // "MENSAL"|"SEMANAL"|"QUINZENAL"|"SEMESTRAL"|"ANUAL"
    "diaPagamento": 5,
    "segundoDiaPagamento": null,
    "mesPagamento": null,
    "dataPagamentoAnual": null,
    "valorRecorrente": 12000.00,
    "admins": [
      {
        "adminId": "uuid",
        "adminName": "João Silva",
        "canViewDetails": true,
        "manuallyAdded": false
      }
    ],
    "steps": [
      {
        "id": "uuid",
        "titulo": "Levantamento de Requisitos",
        "instrucao": "Reunir com o cliente e documentar",
        "dataInicio": "2026-01-01",
        "previsaoConclusao": "2026-01-15",
        "status": "CONCLUIDA",    // "PROGRAMADA"|"EM_ANDAMENTO"|"CONCLUIDA"|"CANCELADA"
        "responsaveis": [
          { "id": "uuid", "name": "João Silva", "email": "joao@empresa.com" }
        ],
        "aprovadores": [
          {
            "id": "uuid",
            "name": "Maria Souza",
            "email": "maria@empresa.com",
            "aprovado": true,
            "aprovadoEm": "2026-01-16T10:30:00Z"
          }
        ],
        "pdfUrls": ["https://storage.exemplo.com/etapa1.pdf"]
      }
    ]
  }
]
```

---

#### `POST /api/contracts`

**Payload — `CreateContractRequest`:**
```json
{
  "title": "Projeto Alpha",                 // *
  "description": "Desenvolvimento web",
  "totalValue": 150000.00,
  "startDate": "2026-01-01",               // YYYY-MM-DD
  "endDate": "2026-12-31",
  "clientId": "uuid",
  "clientName": "Empresa Beta Ltda",
  "clientEmail": "contato@beta.com",
  "category": "TECNOLOGIA",
  "admins": [                               // *
    { "adminId": "uuid", "canViewDetails": true }
  ],
  "recorrencia": true,
  "tipoRecorrencia": "MENSAL",
  "diaPagamento": 5,
  "segundoDiaPagamento": null,
  "mesPagamento": null,
  "dataPagamentoAnual": null,
  "valorRecorrente": 12000.00
}
```

> **Lógica de recorrência:**
> - `MENSAL` / `QUINZENAL` / `SEMESTRAL`: informar `diaPagamento` (1-31).
> - `QUINZENAL`: informar também `segundoDiaPagamento`.
> - `SEMESTRAL`: informar também `mesPagamento` (1-12).
> - `SEMANAL`: informar `diaPagamento` como dia da semana (1=segunda … 7=domingo).
> - `ANUAL`: informar `dataPagamentoAnual` no formato `YYYY-MM-DD`.

**Response `201` — `ContractResponse` criado.**

---

#### `PUT /api/contracts/{id}`

**Payload — `UpdateContractRequest`:**
```json
{
  "title": "Projeto Alpha Revisado",        // *
  "description": "Nova descrição",          // *
  "totalValue": 180000.00,
  "startDate": "2026-01-01",               // * YYYY-MM-DD
  "endDate": "2026-12-31",                 // * YYYY-MM-DD
  "status": "ACTIVE",                      // * "DRAFT"|"ACTIVE"|"SUSPENDED"|"FINISHED"|"CANCELED"
  "category": "TECNOLOGIA",
  "scannedContractUrl": "https://...",
  "finalProjectUrl": "https://...",
  "aiRiskScore": 8.0,
  "aiAnalysisSummary": "Análise atualizada...",
  "autoExtracted": true,
  "keyClauses": ["Cláusula 1", "Cláusula 2"],  // * (pode ser array vazio)
  "recorrencia": true,
  "tipoRecorrencia": "MENSAL",
  "diaPagamento": 10,
  "segundoDiaPagamento": null,
  "mesPagamento": null,
  "dataPagamentoAnual": null,
  "valorRecorrente": 15000.00
}
```

**Response `200` — `UpdatedContractResponse`:**
```json
{
  "id": "uuid",
  "title": "Projeto Alpha Revisado",
  "status": "ACTIVE",
  "totalValue": 180000.00,
  "startDate": "2026-01-01",
  "endDate": "2026-12-31",
  "recorrencia": true,
  "tipoRecorrencia": "MENSAL",
  "diaPagamento": 10,
  "segundoDiaPagamento": null,
  "mesPagamento": null,
  "dataPagamentoAnual": null,
  "valorRecorrente": 15000.00,
  "scannedContractUrl": "https://...",
  "finalProjectUrl": null,
  "message": "Contrato atualizado com sucesso!"
}
```

---

#### `PATCH /api/contracts/{id}/cancel`

Sem payload. Marca o contrato com `status = "CANCELED"`.

**Response `200` ou `204`** — sem corpo.

---

#### `POST /api/contracts/{id}/upload?type=SCANNED|FINAL`

**Payload:** `multipart/form-data` com campo `file` (PDF).

**Query param:** `type` = `SCANNED` (contrato digitalizado) ou `FINAL` (projeto finalizado).

**Response `200` — `ContractResponse` atualizado** com a URL preenchida em `scannedContractUrl` ou `finalProjectUrl`.

---

#### `GET /api/contracts/{id}/history`

Sem payload.

**Response `200` — Array de `ContractHistoryResponse`:**
```json
[
  {
    "id": "uuid",
    "title": "Projeto Alpha",
    "description": "Versão anterior",
    "totalValue": 150000.00,
    "recorrencia": false,
    "tipoRecorrencia": null,
    "diaPagamento": null,
    "segundoDiaPagamento": null,
    "mesPagamento": null,
    "dataPagamentoAnual": null,
    "valorRecorrente": null,
    "status": "DRAFT",
    "category": "TECNOLOGIA",
    "aiRiskScore": null,
    "aiAnalysisSummary": null,
    "keyClauses": [],
    "autoExtracted": false,
    "scannedContractUrl": null,
    "finalProjectUrl": null,
    "modifiedAt": "2026-01-10T14:22:00Z",   // ISO 8601
    "modifiedBy": "João Silva"
  }
]
```

---

#### `GET /api/contracts/categories`

Sem payload.

**Response `200` — Array de strings:**
```json
["CIVIL", "TECNOLOGIA", "INFRAESTRUTURA"]
```

---

### 12.5 Etapas de Contrato

---

#### `GET /api/contracts/{id}/steps`

Sem payload.

**Response `200` — Array de `ContractStepResponse`:**
```json
[
  {
    "id": "uuid",
    "titulo": "Levantamento de Requisitos",
    "instrucao": "Documentar todos os requisitos com o cliente",
    "dataInicio": "2026-01-01",
    "previsaoConclusao": "2026-01-15",
    "status": "CONCLUIDA",
    "responsaveis": [
      { "id": "uuid", "name": "João Silva", "email": "joao@empresa.com" }
    ],
    "aprovadores": [
      {
        "id": "uuid",
        "name": "Maria Souza",
        "email": "maria@empresa.com",
        "aprovado": false,
        "aprovadoEm": null
      }
    ],
    "pdfUrls": []
  }
]
```

---

#### `POST /api/contracts/{id}/steps`

**Payload — `CreateContractStepRequest`:**
```json
{
  "titulo": "Desenvolvimento do Módulo A",  // *
  "instrucao": "Implementar conforme spec",
  "dataInicio": "2026-02-01",              // * YYYY-MM-DD
  "expectedEndDate": "2026-02-28",         // * YYYY-MM-DD
  "status": "PROGRAMADA",                  // * "PROGRAMADA"|"EM_ANDAMENTO"|"CONCLUIDA"|"CANCELADA"
  "responsavelIds": ["uuid-admin-1"],
  "aprovadorIds": ["uuid-admin-2", "uuid-admin-3"]
}
```

**Response `201` — `ContractStepResponse` criada.**

---

#### `PUT /api/contracts/{id}/steps/{stepId}`

**Payload — `UpdateContractStepRequest`:**
```json
{
  "titulo": "Desenvolvimento do Módulo A (revisado)",  // *
  "instrucao": "Instrução atualizada",
  "dataInicio": "2026-02-01",                         // * YYYY-MM-DD
  "previsaoConclusao": "2026-03-05",                  // * YYYY-MM-DD
  "responsavelIds": ["uuid-admin-1"],                  // substitui lista inteira
  "aprovadorIds": ["uuid-admin-2"],                    // substitui lista inteira
  "pdfUrls": ["https://storage.exemplo.com/etapa.pdf"]
}
```

**Response `200` — `ContractStepResponse` atualizada.**

---

#### `PATCH /api/contracts/{id}/steps/{stepId}/status?status={S}`

Sem payload. O novo status é passado como **query param**.

**Valores válidos de `status`:** `PROGRAMADA` | `EM_ANDAMENTO` | `CONCLUIDA` | `CANCELADA`

**Response `200` ou `204`** — sem corpo.

---

#### `PATCH /api/contracts/{id}/steps/{stepId}/approve`

Sem payload. Registra a aprovação do usuário logado na etapa.

**Response `200` ou `204`** — sem corpo.

**Erros:**
- `400` — usuário já aprovou esta etapa.
- `403` — usuário não é aprovador desta etapa.

---

#### `POST /api/contracts/{id}/steps/{stepId}/pdf`

**Payload:** `multipart/form-data` com campo `file` (PDF).

**Response `200` — string** com a URL do PDF armazenado:
```
"https://storage.exemplo.com/steps/uuid/documento.pdf"
```

---

### 12.6 Setores (Company Sections)

---

#### `GET /api/company-sections`

Sem payload.

**Response `200` — Array de `CompanySection`:**
```json
[
  {
    "id": "uuid",
    "name": "TECNOLOGIA",
    "categoriesPermitted": ["TECNOLOGIA", "SOFTWARE"],
    "members": [
      {
        "userId": "uuid",
        "userName": "João Silva",
        "role": "LEADER"          // "LEADER" | "MEMBER"
      },
      {
        "userId": "uuid-2",
        "userName": "Ana Costa",
        "role": "MEMBER"
      }
    ]
  }
]
```

---

#### `POST /api/company-sections`

**Payload — `CreateCompanySectionRequest`:**
```json
{
  "name": "ENGENHARIA CIVIL",                           // *
  "categoriesPermitted": ["CIVIL", "INFRAESTRUTURA"],   // * (pode ser [])
  "members": [
    { "userId": "uuid-diretor", "role": "LEADER" },
    { "userId": "uuid-membro", "role": "MEMBER" }
  ]
}
```

> **Regra:** O nome deve conter apenas **letras maiúsculas** e espaços, sem acentos ou caracteres especiais. A UI sanitiza automaticamente antes do envio.

**Response `201` — `CompanySection` criado.**

---

#### `GET /api/company-sections/{id}`

Sem payload. Retorna `CompanySection` pelo ID.

---

#### `PATCH /api/company-sections/{id}`

**Payload — `UpdateCompanySectionRequest`** (campos opcionais):
```json
{
  "name": "ENGENHARIA CIVIL REVISADO",
  "categoriesPermitted": ["CIVIL", "OBRAS"]
}
```

**Response `200` — `CompanySection` atualizado.**

---

#### `DELETE /api/company-sections/{id}`

Sem payload.

**Response `204`** — sem corpo.

---

#### `POST /api/company-sections/{id}/members`

**Payload — `AddMemberRequest`:**
```json
{
  "userId": "uuid",         // *
  "role": "MEMBER"          // * "LEADER" | "MEMBER"
}
```

**Response `200` — `CompanySection` atualizado.**

---

#### `DELETE /api/company-sections/{id}/members/{userId}`

Sem payload.

**Response `204`** — sem corpo.

---

#### `GET /api/company-sections/my-contracts`

Sem payload. Retorna contratos visíveis ao admin autenticado com base nos setores que pertence.

**Response `200` — Array de `SectionContractSummary`:**
```json
[
  {
    "id": "uuid",
    "title": "Projeto Alpha",
    "clientId": "uuid",
    "clientName": "Empresa Beta Ltda",
    "startDate": "2026-01-01",
    "endDate": "2026-12-31",
    "totalValue": 150000.00,
    "status": "ACTIVE",
    "category": "TECNOLOGIA",
    "canViewDetails": true
  }
]
```

---

### 12.7 Notificações

---

#### `GET /api/notifications/unread`

Sem payload.

**Response `200` — Array de `Notification`:**
```json
[
  {
    "id": "uuid",
    "title": "Aprovação solicitada",
    "message": "João pediu aprovação na etapa 'Desenvolvimento' do contrato 'Projeto Alpha'.",
    "type": "APROVACAO_SOLICITADA",
    "contractId": "uuid",
    "contractStepId": "uuid",
    "read": false,
    "createdAt": "2026-03-27T10:00:00Z"
  }
]
```

**Tipos de notificação (`type`):**

| Valor | Significado |
|---|---|
| `ATRIBUIDO_RESPONSAVEL` | Admin atribuído como responsável de uma etapa |
| `ATRIBUIDO_APROVADOR` | Admin atribuído como aprovador de uma etapa |
| `ETAPA_APROVADA` | Um aprovador registrou sua aprovação |
| `ETAPA_TOTALMENTE_APROVADA` | Todos os aprovadores da etapa aprovaram |
| `APROVACAO_SOLICITADA` | Responsável solicitou aprovação aos aprovadores pendentes |

---

#### `GET /api/notifications`

Sem payload. Retorna **todas** as notificações (lidas e não lidas). Mesmo schema do endpoint acima.

---

#### `PATCH /api/notifications/{id}/read`

Sem payload. Marca a notificação como lida (`read = true`).

**Response `200` ou `204`** — sem corpo.

---

#### `PATCH /api/notifications/read-all`

Sem payload. Marca todas as notificações do usuário como lidas.

**Response `200` ou `204`** — sem corpo.

---

#### `POST /api/notifications`

**Payload — `CreateNotificationRequest`:**
```json
{
  "recipientId": "uuid",                    // * UUID do destinatário
  "title": "Aprovação solicitada",          // *
  "message": "João pediu sua aprovação...", // *
  "type": "APROVACAO_SOLICITADA",           // *
  "contractId": "uuid",                     // *
  "contractStepId": "uuid"                  // *
}
```

**Response `201`** — sem corpo ou objeto criado.

---

### 12.8 Reuniões (Scheduling)

---

#### `GET /api/meetings`

Sem payload.

**Response `200` — Array de `MeetingResponse`:**
```json
[
  {
    "id": "uuid",
    "title": "Kickoff Projeto Alpha",
    "startTime": "2026-04-01T14:00:00Z",    // ISO 8601
    "endTime": "2026-04-01T15:00:00Z",
    "status": "CONFIRMADO",                 // "EM_ANALISE"|"CONFIRMADO"|"CANCELADO"|"RECUSADO"
    "adminId": "uuid",
    "adminName": "João Silva",
    "clientId": "uuid",
    "clientName": "Empresa Beta Ltda",
    "myNote": "Levar proposta de cronograma"  // null se não houver nota
  }
]
```

---

#### `POST /api/meetings`

**Payload — `CreateMeetingRequest`:**
```json
{
  "title": "Kickoff Projeto Alpha",             // *
  "startTime": "2026-04-01T14:00:00Z",         // * ISO 8601
  "endTime": "2026-04-01T15:00:00Z",           // * ISO 8601
  "adminId": "uuid",                           // *
  "clientId": "uuid"                           // *
}
```

**Response `201` — `MeetingResponse` criada** com `status = "EM_ANALISE"`.

---

#### `GET /api/meetings/{id}`

Sem payload. Retorna `MeetingResponse` incluindo `myNote` do usuário logado.

---

#### `PATCH /api/meetings/{id}/confirm`

Sem payload. Altera `status` para `"CONFIRMADO"`. Exclusivo para ADMINs.

**Response `200` — `MeetingResponse` atualizada.**

---

#### `PUT /api/meetings/{id}/notes`

**Payload — `UpdateNoteRequest`:**
```json
{
  "content": "Levar proposta de cronograma atualizada"  // *
}
```

**Response `200` ou `204`** — sem corpo.

---

## Status de Domínio — Referência Rápida

### Status de Contrato

| Valor | Exibição | Cor |
|---|---|---|
| `DRAFT` | Rascunho | Cinza |
| `ACTIVE` | Ativo | Verde |
| `SUSPENDED` | Suspenso | Amarelo |
| `FINISHED` | Finalizado | Azul |
| `CANCELED` | Cancelado | Vermelho |

### Status de Etapa

| Valor | Exibição |
|---|---|
| `PROGRAMADA` | Programada |
| `EM_ANDAMENTO` | Em Andamento |
| `CONCLUIDA` | Concluída |
| `CANCELADA` | Cancelada |

### Status de Reunião

| Valor | Exibição |
|---|---|
| `EM_ANALISE` | Em Análise |
| `CONFIRMADO` | Confirmado |
| `CANCELADO` | Cancelado |
| `RECUSADO` | Recusado |

### Tipos de Conta Bancária

| Valor | Exibição |
|---|---|
| `CORRENTE` | Corrente |
| `POUPANCA` | Poupança |
| `SALARIO` | Salário |
| `PAGAMENTO` | Pagamento |
