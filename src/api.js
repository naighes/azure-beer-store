'use strict'

const {graphql} = require('graphql')
const {makeExecutableSchema} = require('graphql-tools')
const DocumentClient = require('documentdb').DocumentClient

const schema = [`
  enum BeerType {
    IPA
    PaleAle
    Sour
  }

  type Query {
    beers(type: BeerType): [Beer]
  }

  type Beer {
    id: String!
    name: String!
    thumb_url: String
    purchase_price: Float!
    type: BeerType!
  }
`]

const resolvers = {
  Beer: {
    id({id}) {
      return id
    },
    name({name}) {
      return name
    },
    purchase_price({purchase_price}) {
      return purchase_price
    },
    thumb_url({thumb_url}) {
      return thumb_url
    },
    type({type}) {
      return type
    }
  },
  Query: {
    beers(root, {type}, context) {
      return context.listBeers(type)
    }
  }
}

const executableSchema = makeExecutableSchema({
  typeDefs: schema,
  resolvers
})

const db = (client, dbName, collectionName) => {
  return {
    listBeers: type => {
      const query = typeof type !== 'undefined'
        ? {
          query: 'SELECT b.id, b.name, b.purchase_price, b.thumb_url, b.type FROM beer_list b WHERE b.type = @type',
          parameters: [{
            name: '@type',
            value: type
          }]
        }
        : 'SELECT b.id, b.name, b.purchase_price, b.thumb_url, b.type FROM beer_list b'

      return new Promise((resolve, reject) => {
        client.queryDocuments(`dbs/${dbName}/colls/${collectionName}`, query )
          .toArray((error, result) => {
            if (error) {
              reject(error)
            } else {
              resolve(result);
            }
          })
      })
    }
  }
}

const writeResult = (result, status) => {
  return {
    status: status,
    headers: {
      'Content-Type': 'application/json'
    },
    body: result
  }
}

module.exports.graphql = (context, request) => {
  const dbName = process.env['DB_NAME'],
    collectionName = process.env['DB_COLLECTION_NAME'],
    client = new DocumentClient(process.env['DB_HOST'], {
      masterKey: process.env['DB_KEY']
    })
  let query = request.method === 'POST' ? request.body : request.query

  if (query.query) {
    query = query.query
  }

  graphql({schema: executableSchema,
    source: query,
    contextValue: db(client, dbName, collectionName)})
    .then(result => {
      context.res = result.errors
        ? writeResult(result.errors, 400)
        : writeResult(result, 200)
    })
    .catch(error => {
      context.res = writeResulti(error, 500)
    })
    .then(_ => context.done())
}

