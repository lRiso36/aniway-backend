import app from './app'
import config from './config/config'

import connectDB from './config/db'


connectDB().then(() => {
  const server = app.listen(config.port, () => {
    console.log("Server running on port:", config.port)
  })


  server.on('SIGINT', () => {
    console.log("Shutting down server...")
    server.close(() => {
      console.log("Server closed.")
    })
  })
  
}).catch(err => {
  console.error("Failed to connect to the database:", err)
})