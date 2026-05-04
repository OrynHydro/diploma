import express from 'express'
import type { Application, RequestHandler } from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import dns from "node:dns/promises";
dns.setServers(["1.1.1.1"]);

import usersRouter from './routes/users.js'
import productsRouter from './routes/products.js'

import { MongoConnect } from './middleware/mongo-connect.js'

const app: Application = express()

const port = 5000

app.use(cors())
app.use(express.json())

app.use('/users', usersRouter)
app.use('/products', productsRouter)

dotenv.config({ path: '.env.local' })

MongoConnect()


app.listen(port, () => console.log(`Server is running on port ${port}`))
