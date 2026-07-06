# CareerOS Architecture

## Visão Geral

CareerOS é uma plataforma para otimização de carreira baseada em Inteligência Artificial.

A arquitetura foi dividida em módulos independentes para facilitar evolução, manutenção e testes.

```
               +----------------------+
               |     Web Interface    |
               +----------+-----------+
                          |
               +----------v-----------+
               |    Application API   |
               +----------+-----------+
                          |
      +-------------------+------------------+
      |                   |                  |
+-----v-----+      +------v------+    +------v------+
| Curriculum|      | AI Services |    | User Module |
+-----------+      +-------------+    +-------------+
      |                   |                  |
      +---------+---------+------------------+
                |
        +-------v-------+
        | Persistence   |
        +---------------+
```

## Camadas

- Presentation
- Application
- Domain
- Infrastructure

## Princípios

- Clean Architecture
- SOLID
- DRY
- KISS
- Separation of Concerns
