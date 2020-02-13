const MongoClient = require("mongodb").MongoClient
const ObjectId = require("mongodb").ObjectId
const MongoError = require("mongodb").MongoError
require("dotenv").config()

/**
 * Ticket: Migration
 *
 * Update all the documents in the `movies` collection, such that the
 * "lastupdated" field is stored as an ISODate() rather than a string.
 *
 * The Date.parse() method build into Javascript proved very useful here!
 * Refer to http://mongodb.github.io/node-mongodb-native/3.1/tutorials/crud/#bulkwrite
 */

// This leading semicolon (;) is to signify to the parser that this is a new expression. This expression is an
// Immediately Invoked Function Expression (IIFE). It's being used to wrap this logic in an asynchronous function
// so we can use await within.

;(async () => {
  try {
    const host = process.env.MFLIX_DB_URI
    const client = await MongoClient.connect(host, { useNewUrlParser: true })
    const mflix = client.db(process.env.MFLIX_NS)

    // adding a predicate that checks that the `lastupdated` field exists, and then
    // check that its type is a string
    // a projection was not required, but helped reduce the amount of data sent
    // over the wire!
    // BSON type of "type" string is "2". 
    // Refer to: https://docs.mongodb.com/manual/reference/operator/query/type/#available-types
    const predicate = { lastupdated: { $exists: true, $type : 2 } }
    const projection = { lastupdated: 1 }
    const cursor = await mflix
      .collection("movies")
      .find(predicate, projection)
      .toArray()
      console.log(cursor)
    const moviesToMigrate = cursor.map(({ _id, lastupdated }) => ({
      updateOne: {
        filter: { _id: ObjectId(_id) },
        update: {
          $set: { lastupdated: new Date(Date.parse(lastupdated)) },
        },
      },
    }))
    console.log(
      "\x1b[32m",
      `Found ${moviesToMigrate.length} documents to update`,
    )

    const { modifiedCount } = await mflix.collection("movies").bulkWrite(moviesToMigrate)

    console.log("\x1b[32m", `${modifiedCount} documents updated`)
    client.close()
    process.exit(0)
  } catch (e) {
    if (
      e instanceof MongoError &&
      e.message.slice(0, "Invalid Operation".length) === "Invalid Operation"
    ) {
      console.log("\x1b[32m", "No documents to update")
    } else {
      console.error("\x1b[31m", `Error during migration, ${e}`)
    }
    process.exit(1)
  }
})()
