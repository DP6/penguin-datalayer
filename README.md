# DataLayer Penguin

O Penguin Datalayer é uma ferramenta Open Source desenvolvida pela DP6 que tem como intuito auxiliar no processo de validação da implementação da camada de dados (Data Layer), através de um modelo de dados (schema) que represente com fidelidade as chaves, valores, tipos de dados esperados.
A ferramenta atua como um crawler, acompanhando os disparos efetuados para o Data Layer, e validando cada objeto enviado com base no schema entregue à esta.

## Conteúdo
  - [Conteúdo](#conteúdo)
    - [Instalação](#instalação)
    - [Como Utilizar](#como-utilizar)
    - [JSON Schema](#json-schema)
      - [Tipos Suportados](#tipos-suportados)
      - [Regras de validação](#regras-de-validação)
      - [Estrutura do JSON Schema](#estrutura-do-json-schema)



### Instalação

Para instalar a versão atual:

``` npm install -i```

Após a instalação da biblioteca, a estrutura de diretórios deve ser a seguinte:

```bash
├── config
├── lib
├── results
└── schema
```

### Como Utilizar

O DataLayer Penguin realiza a validação de hits enviados para a Camada de Dados (Data Layer). 
Para garantir que o hit que foi enviado está estruturado da forma correta e com os valores esperados, faz-se necessária a inclusão de dois arquivos que são gerados manualmente, sendo estes:

 - JSON Schema
 - Config

Tanto o JSON Schema quanto o arquivo de config são gerados através da seguinte planilha:
[Ludwig - Schema & Config](https://docs.google.com/spreadsheets/d/19FZ7NzUBj50RABrHdJwSBjN9cdz3xHWxILBtlmqLVHs/edit#gid=2104489795)

O arquivo de configurações para a execução do DataLayer Penguin deve ser inserido na pasta **config**, e o JSON Schema na pasta **schema**, respectivamente

```bash
├── config
│   ├── config_example.json
├── results
└── schema
    ├── schema_example.json    
```

Para execução do validador, é esperado como parâmetro o arquivo de configuração, conforme demonstrado no exemplo a seguir:

```npm start config_example.json```

Após executar o comando, o validador iniciará uma instância do *Chromium*, lendo as configurações da URL de início, nome da camada de dados e o JSON Schema para validação. 

Os hits que forem disparados de forma automática para a camada de dados e estiverem declarados no JSON Schema serão validados de forma automática. Entretanto, o validador necessitará de interação humana caso haja algum hit que necessita de uma ação (click, preenchimento de form, etc.) para ser disparado.

Por padrão, os logs com a validação serão disponibilizados na pasta **results**, em pdf ou xlsx, dependendo do parâmetro que for passado na linha de comando que executa o DataLayer Penguin, como por exemplo:

```nodejs
npm start config_example.json pdf
```

ou

```nodejs
npm start config_example.json xlsx
```


### JSON Schema

O JSON Schema é uma estrutura que permite a **validação** de documentos JSON. Esta estrutura é utilizada no projeto pois permite a declaração dos formatos de dados esperados dentro da camada de dados.

#### Tipos Suportados

Os seguintes tipos de dados são suportados:

- String
- Number
- Boolean
- Object
- Array

#### Regras de validação

As seguintes regras para validação são aceitas:

- **Enum (Equals)**: A ser utilizada quando houver a necessidade de validar a **igualdade** entre o valor informado no schema *versus* o que foi enviado para a camada de dados
- **Pattern (Regex - String)**: É possível criar expressões regulares para validar valores das chaves 
- **minItems (Array)**: Valida o número mínimo de itens contidos no array
- **Required**: Quando houver a obrigatoriedade de validar uma determinada chave


#### Estrutura do JSON Schema

A estrutura a seguir é um exemplo de um JSON Schema:

```json
{
  "$schema": "",
  "title": "Schema example",
  "array": {
    "$id": "#/properties/schema",
    "type": "array",
    "items": [
      {
        "type": "object",
        "properties": {
          "event": {
            "type": "string",
            "enum": ["teste"]
          },
          "key1": {
            "type": "object",
            "properties": {
              "key1_sub1": {
                "type": "number",
                "enum": [10]
              },
              "key1_sub2": {
                "type": "string",
                "pattern": "teste|test|.*"
              },
              "key1_sub3": {
                "type": "string",
                "enum": ["producao"]
              },
              "key1_sub4": {
                "type": "boolean",
                "enum": "desktop|mobile|msite"
              },
            },
            "required": [
              "key1_sub1",
              "key1_sub2",
              "key1_sub3",
              "key1_sub4"
            ]
          }
        },"required": ["event"]
      },
    ]
  }
}

```

### Contribuição

O DataLayer Penguin é um projeto Open Source, e portanto, contribuições serão bem vindas

