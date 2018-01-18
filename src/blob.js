'use strict'

const DocumentClient = require('documentdb').DocumentClient

const parseRow = (input, start, acc) => {
  const index = input.indexOf(',', start)

  return index == -1
    ? acc.concat(input.substring(start, input.length))
    : parseRow(input, index + 1, acc.concat([input.substring(start, index)]))
}

const deleteDatabase = (client, dbName) => {
  return new Promise((resolve, reject) => {
    client.deleteDatabase(`dbs/${dbName}`, (error, result) => {
      if (error) {
        reject(error)
      } else {
        resolve(result)
      }
    })
  })
}

const createDatabase = (client, dbName) => {
  return new Promise((resolve, reject) => {
    client.createDatabase({id: dbName}, (error, result) => {
      if (error) {
        reject(error)
      } else {
        resolve(result)
      }
    })
  })
}

const createCollection = (client, dbName, collectionName) => {
  return new Promise((resolve, reject) => {
    client.createCollection(`dbs/${dbName}`,
      {id: collectionName},
      {offerThroughput: 400},
      (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      })
  })
}

const batchInsert = (client, dbName, collectionName, documents) => Promise.all(documents.map(d => {
  return new Promise((resolve, reject) => {
    client.createDocument(`dbs/${dbName}/colls/${collectionName}`, d, (error, result) => {
      if (error) {
        reject(error)
      } else {
        resolve(result)
      }
    })
  })
}))

const asDocument = raw => {
  return {
    id: raw[0],
    name: raw[1],
    purchase_price: parseFloat(raw[2]),
    thumb_url: raw[3],
    type: raw[4]
  }
}

module.exports.import = (context, item) => {
  const dbName = process.env['DB_NAME'],
    collectionName = process.env['DB_COLLECTION_NAME'],
    client = new DocumentClient(process.env['DB_HOST'], {
      masterKey: process.env['DB_KEY']
    })

  const documents = item.split('\n')
    .map(r => parseRow(r, 0, []))
    .filter(r => r.length === 5)
    .map(asDocument)

  deleteDatabase(client, dbName)
    .then(_ => createDatabase(client, dbName))
    .catch(_ => context.log('database not found'))
    .then(_ => createCollection(client, dbName, collectionName))
    .then(_ => batchInsert(client, dbName, collectionName, documents))
    .then(_ => context.done())
    .catch(e => {
      // TODO: what about retrying policies?
      // TODO: delete blob once task run to completion
      context.log.error(`ERROR: ${JSON.stringify(e)}`)
      context.done()
    })
}
