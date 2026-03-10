import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { handleDeleteOld } from './controllers/openingControllers';

const expressApp = express();

expressApp.use(cors());
expressApp.use(helmet());
expressApp.use(express.json());

expressApp.delete('/old-walls', handleDeleteOld);

export default expressApp;
