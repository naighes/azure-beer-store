const assert = require('assert')
const handler = require('../handler')

describe('querying', () => {
  it('retrieving beers', done => {
    let context = {
      done: () => {
        assert.equal(200, context.res.status)
        done()
      }
    }
    const type = 'BLONDE'
    const request = {
      query: `{beers(type:${type}){name}}`,
      method: 'GET'
    }
    handler.graphql(context, request)
  })
  it('wrong format', done => {
    let context = {
      done: () => {
        assert.equal(400, context.res.status)
        done()
      }
    }
    const type = 'BLONDE'
    const request = {
      query: `{beer(type:${type}){name}}`,
      method: 'GET'
    }
    handler.graphql(context, request)
  })
})
