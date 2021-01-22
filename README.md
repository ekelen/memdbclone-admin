# medieval-db-clone

I find the [Medieval and Early Modern Databank](http://www2.scc.rutgers.edu/memdb/) a useful and reliable tool, but it has some misformatted data and isn't conducive for programmatic use.

This project provides only scripts to scrape the site's results pages, clean the data, and upload them to MongoDB. It pulls data only from [Spufford's Currency Exchanges](http://www2.scc.rutgers.edu/memdb/search_form_spuf.php).

A seperate repository is under construction to support a browser-based production UI, similar to Rutgers' with some UX improvements.

Short-term TODO:

- Usage guide
- Scrape other databases in the bank

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
