'use strict'

const {graphql} = require('graphql')
const {makeExecutableSchema} = require('graphql-tools')

const schema = [`
  enum BeerType {
    BLONDE
    BLACK
    RED
  }

  type Query {
    beers(type: BeerType): [Beer]
  }

  type Beer {
    id: Int!
    name: String!
    description: String
    thumb_url: String
    price: Float!
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
    description({description}) {
      return description
    },
    price({price}) {
      return price
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

const db = {
  listBeers: type => {
    return [{
      id: 1,
      name: 'Becks',
      description: 'a tasty blond beer',
      price: 4.2
    }, {
      id: 2,
      name: 'Corona',
      description: 'a lightweight beer',
      price: 3.8
    }]
  }
}

const writeResult = (result, status) => {
  return {
    status: status,
    body: JSON.stringify(result)
  }
}

module.exports.graphql = (context, request) => {
  let query = request.method === 'POST' ? request.body : request.query

  if (query.query) {
    query = query.query
  }

  graphql({schema: executableSchema,
    source: query,
    contextValue: db})
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
