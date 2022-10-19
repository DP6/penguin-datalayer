# Penguin DataLayer

<div align="center">
<img src="https://raw.githubusercontent.com/DP6/templates-centro-de-inovacoes/main/public/images/centro_de_inovacao_dp6.png" height="100px" />

</div>
<p align="center">
  <a href="#badge">
    <img alt="semantic-release" src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg">
  </a>
  <a href="https://www.codacy.com/gh/DP6/penguin-datalayer/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=DP6/penguin-datalayer&amp;utm_campaign=Badge_Grade"><img src="https://app.codacy.com/project/badge/Grade/afcd617698e744cb8f6f44f4cdc8ddd9"/></a>
</p>

Read this in other languages: [Português-BR](README.pt-br.md)

The Penguin DataLayer is an Open Source tool developed by DP6 with the objective to help in the validation process of implementing the data layer, by using a schema that faithfully represents the keys, values and expected data types.
The tool acts as a crawler, following data layer triggers and validating every object sent against a schema.

## Table of contents

- [Penguin DataLayer](#penguin-datalayer)
  - [Table of contents](#table-of-contents)
    - [Install](#install)
    - [How to use](#how-to-use)
    - [JSON Schema](#json-schema)
      - [Supported Types](#supported-types)
      - [Validation Rules](#validation-rules)
      - [JSON Schema Structure](#json-schema-structure)
  - [How to contribute](#how-to-contribute)
    - [Mandatory Requisites](#mandatory-requisites)
  - [Support:](#support)

### Install

To install the current version:

` npm install -i`

After installing the library, the directory structure should look like the following:

```bash
├── config
├── lib
├── results
└── schema
```

### How to use

The DataLayer Penguin validates every hit sent to the Data Layer.
To ensure every hit is sent correctly formulated and with the expected values, it's necessary to include two manually generated files:

- JSON Schema
- Config

Both config files should be generated through the following sheet:
[Ludwig - Schema & Config](https://docs.google.com/spreadsheets/d/1U1YbPmRQDvUv4X8m0I8GYNr8pXR8ADYttzKw79NIlcQ/edit#gid=631532070)

The config file must be saved in the **config** folder, and the JSON Schema in the **schema** folder. Example:

```bash
├── config
│   ├── config_example.json
├── results
└── schema
    ├── schema_example.json
```

To execute the validator, you must pass the config file as a parameter:

`npm start config_example.json`

After executing this command, the validator will spin up a _Chromium_ instance, reading the initial URL config, data layer name and JSON Schema.

Every hit sent automatically to the data layer will be automatically validated, however, the validator will need human interaction in case any hit needs interaction to be sent (click, form fill, etc.)

By default, the validation logs are available in the folder **results**, in pdf or xlsx format, depending on the parameter defined in the command line when DataLayer Penguin is executed, Example:

```nodejs
npm start config_example.json pdf
```

or

```nodejs
npm start config_example.json xlsx
```

### JSON Schema

The JSON Schema is a structure that allows the **validation** of JSON documents. This structures is used in the project because it allows for the declaration of expected data in the data layer.

#### Supported Types

The following types are supported:

- String
- Number
- Boolean
- Object
- Array

#### Validation Rules

The following validation rules are accepted:

- **Enum (Equals)**: Used when you need to validate the **equality** between the expected value _versus_ the value sent to the data layer
- **Pattern (Regex - String)**: It's possible to create regular expressions to validate the keys values
- **minItems (Array)**: Validates the minimum number of items in the array
- **Required**: When a value is mandatory for a key

#### JSON Schema Structure

The following is an example of a JSON Schema:

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
                "type": "number"
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
                "type": "boolean"
              }
            },
            "required": ["key1_sub1", "key1_sub2", "key1_sub3", "key1_sub4"]
          }
        },
        "required": ["event"]
      }
    ]
  }
}
```

## How to contribute

Pull requests are welcome! We'd love your help to level up this module. Feel free to look at the open issues for something to do. In case you have a new feature request or bug report, please open a new issue so our team can investigate it

### Mandatory Requisites

We only accept contributions that follows these requisites:

- [Commit template](https://www.conventionalcommits.org/en/v1.0.0/)

## Support:

**DP6 Koopa-troopa Team**

_e-mail: <mailto:koopas@dp6.com.br>_

<img src="https://raw.githubusercontent.com/DP6/templates-centro-de-inovacoes/main/public/images/koopa.png" height="100" />
