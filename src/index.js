import app from "./server"
import { MongoClient } from "mongodb"
import MoviesDAO from "../src/dao/moviesDAO"
import UsersDAO from "./dao/usersDAO"
import CommentsDAO from "./dao/commentsDAO"

const port = process.env.PORT || 8000

/**
Ticket: Connection Pooling

Changed the configuration of the MongoClient object by setting the
maximum connection pool size to 50 active connections.
*/

/**
Ticket: Timeouts

Prevented the program from waiting indefinitely by setting the write
concern timeout limit to 2500 milliseconds.
*/

MongoClient.connect(
  process.env.MFLIX_DB_URI,{
  // Sets the poolSize to 50 connections.
  poolSize: 50,
  // Set the write timeout limit to 2500 milliseconds.
  wtimeout: 2500
  },
  { useNewUrlParser: true },
)
  .catch(err => {
    console.error(err.stack)
    process.exit(1)
  })
  .then(async client => {
    await MoviesDAO.injectDB(client)
    await UsersDAO.injectDB(client)
    await CommentsDAO.injectDB(client)
    app.listen(port, () => {
      console.log(`listening on port ${port}`)
    })
  })
