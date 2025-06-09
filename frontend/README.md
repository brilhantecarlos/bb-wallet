# Bitcoin Wallet Frontend

Interface de usuário para a carteira Bitcoin, desenvolvida com Angular. Este frontend se integra com a API local Bitcoin Wallet para oferecer uma experiência completa de gerenciamento de carteiras Bitcoin.

Este projeto foi gerado usando [Angular CLI](https://github.com/angular/angular-cli) versão 19.2.10.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Funcionalidades

### Carteiras Bitcoin
- Criação de novas carteiras (suporte a vários formatos)
- Listagem de carteiras armazenadas localmente
- Visualização detalhada de carteiras
- Armazenamento local com SQLite via API backend

### Transações
- Criação de transações
- Visualização de histórico
- Acompanhamento de UTXOs

### Importação e Exportação
- Exportação de carteiras
- Importação de carteiras existentes

## Integração com Backend

Este frontend se integra com a API local Bitcoin Wallet Core, que deve estar rodando em `http://localhost:8000`. Para o funcionamento completo, certifique-se de que o backend está em execução.

### Iniciar o Backend

```bash
cd /caminho/para/Bitcoin-Wallet
python -m app.main
```

### Armazenamento Local SQLite

O frontend agora suporta armazenamento local de carteiras usando SQLite através da API backend. Isso permite:

- Persistência de dados das carteiras
- Armazenamento seguro de chaves públicas e informações de endereços
- Histórico de transações
- Rastreamento de UTXOs

Todas essas informações são armazenadas localmente na máquina do usuário em um banco de dados SQLite gerenciado pelo backend.

## Recursos Adicionais

Para mais informações sobre o uso do Angular CLI, incluindo referências detalhadas de comandos, visite a página [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli).
