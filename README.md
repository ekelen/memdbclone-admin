# medieval-db-clone

I find the [Medieval and Early Modern Databank](http://www2.scc.rutgers.edu/memdb/) a useful and reliable tool, but it has some misformatted data and isn't conducive for programmatic use.

This project provides only scripts to scrape the site's results pages, clean the data, and upload them to MongoDB. It pulls data only from [Spufford's Currency Exchanges](http://www2.scc.rutgers.edu/memdb/search_form_spuf.php).

A seperate repository is under construction to support a browser-based production UI, similar to Rutgers' with some UX improvements.

## Short-term TODO:

- Usage guide
- Link simple search interface in this doc
- Add About section for each collection
- (Open to gql queries?)
- Scrape other databases in the bank

  - [ ] Currency Exchanges (Mueller)
  - [ ] Currency Exchanges (Metz)
  - [x] Currency Exchanges (Spufford)
  - [x] Prices (Posthumus)
  - [ ] Prices (Metz)
  - [ ] Prices and Wages (Munro)
    - [ ] `wages.xls`
    - [ ] `coinage.xls`
    - [ ] `brabant_comm.xsl`
    - [ ] `textile_prod.xls`
    - [ ] `vanderwee.xls`
    - [ ] `bruges_wool.xls`
    - [ ] `ghent_wool.xls`
    - [ ] `ghent_wool1.xls`
    - [ ] `flanders_basket.xls`
    - [ ] `oxford_cloth.xls`
    - [ ] `eng_comm.xls`
    - [ ] `EngBasketPrices.xls` - only:
      - [ ] Annual
      - [ ] Wage5YrMeans
    - [ ] `pbh_index.xls`
    - [ ] `WagesPricesAntwerpEngl.xls`
    - [ ] `fland_drape.xls`
    - [ ] `ghent_cloth.xls`
    - [ ] `ghent_drape.xls`
    - [ ] `ghent_drape1.xls`
    - [ ] `leiden_wool.xls`
    - [ ] `ypres_farm.xls`
    - [ ] `ypres_stats.xls`
    - [ ] `ypres_drape.xls`
    - [ ] `ypres_stall.xls`
    - [ ] `ypres_stats1.xls`
    - [ ] `ypres_wool.xls`
    - [ ] `mech_woool.xls`
    - [ ] `erasmus_income.xls`
    - [ ] `kortrijk_linen.xls`

## Schemas

### Prices (Posthumus)

```js
{
  $jsonSchema: {
    properties: {
      Currency: {
        bsonType: 'string'
      },
      Modified: {
        bsonType: 'date'
      },
      Month: {
        bsonType: 'int'
      },
      Notes: {
        bsonType: 'int'
      },
      Num: {
        bsonType: 'int'
      },
      Price: {
        bsonType: [
          'int',
          'double'
        ]
      },
      ProductDutch: {
        bsonType: 'string'
      },
      ProductEnglish: {
        bsonType: 'string'
      },
      Volume: {
        bsonType: 'string'
      },
      Year: {
        bsonType: 'int'
      },
      _rawEntry: {
        bsonType: 'string'
      }
    }
  }
}
```

### Currency Exchanges (Spufford)

```js
{
  $jsonSchema: {
    required: [
      '_rawEntry',
      'Modified',
      'Num',
      'Currency (To)',
      'Currency (From)',
      'Date (Start)',
      'Date (End)',
      'Amount (From)',
      'Amount (To)',
      'Type of Exchange',
      'Invalid Fields'
    ],
    properties: {
      Modified: {
        bsonType: 'date'
      },
      Place: {
        bsonType: 'string'
      },
      'Currency (From)': {
        bsonType: 'string'
      },
      'Currency (To)': {
        bsonType: 'string'
      },
      'Amount (From)': {
        bsonType: [
          'double',
          'int',
          'null'
        ]
      },
      'Amount (To)': {
        bsonType: [
          'double',
          'int',
          'null'
        ]
      },
      Num: {
        bsonType: 'int'
      },
      'Date (Start)': {
        bsonType: [
          'date',
          'string',
          'null'
        ]
      },
      'Date (End)': {
        bsonType: [
          'date',
          'string',
          'null'
        ]
      },
      'Invalid Fields': {
        bsonType: 'array',
        items: {
          bsonType: 'string',
          'enum': [
            'Date (End)',
            'Date (Start)',
            'Amount (From)',
            'Amount (To)'
          ]
        }
      }
    }
  }
}
```
