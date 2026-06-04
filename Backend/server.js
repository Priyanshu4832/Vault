import express from "express";
import dotenv from "dotenv";
dotenv.config();
import authRoutes from './Routes/authRoutes.js'
import {errorHandler} from './Middlewares/errorMiddleware.js'
import notesRoutes from './Routes/notesRoutes.js'


const app = express();
const PORT = process.env.PORT || 7000;

app.use(express.json());
app.use(express.urlencoded({extended : false}));



app.use('/api/auth' , authRoutes);
app.use('/api/notes',notesRoutes);
app.use(errorHandler);


app.listen(PORT , ()=>{console.log(`Server is running on port ${PORT}`)});