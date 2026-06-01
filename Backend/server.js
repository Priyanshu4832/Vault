import express from "express";
import dotenv from "dotenv";
dotenv.config();
import authRoutes from './Routes/authRoutes.js'
import {errorHandler} from './Middlewares/errorMiddleware.js'


const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({extended : false}));



app.use('/api/auth' , authRoutes);
app.use(errorHandler);


app.listen(PORT , ()=>{console.log(`Server is running on port ${PORT}`)});