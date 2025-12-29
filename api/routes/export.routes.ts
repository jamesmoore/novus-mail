import { Router } from 'express';
import { noCacheMiddleware } from './noCacheMiddleware.js';
import { DatabaseFacade } from '../databaseFacade.js';
import multer from "multer";
import { Address } from '../models/address.js';
import { Mail } from '../models/mail.js';

interface ExportFile {
    addresses: Address[],
    mails: Mail[],
}

export function createRouter(databaseFacade: DatabaseFacade) {

    const router = Router();
    router.use(noCacheMiddleware);

    router.get('/export', (req, res) => {
        const addresses = databaseFacade.getAddresses(req.user?.sub);
        const mails = databaseFacade.getAllMails(req.user?.sub);
        const userName = req.user?.name;
        const filename = (userName ? userName + '_' : '') + Date.now() + '.json';
        res.setHeader('content-disposition', 'attachment; filename=' + filename);
        res.json({
            addresses: addresses,
            mails: mails,
        });
    });

    const upload = multer();

    router.post('/import', upload.single('file'), (req, res) => {

        if (req.file) {
            var data = JSON.parse(req.file.buffer.toString()) as ExportFile;
            console.log("Received addresses: " + data.addresses.length);
            console.log("Received mails: " + data.mails.length);

            data.addresses.forEach((addr) => {
                var existing = databaseFacade.getAddress(addr.addr);
                if (!existing) {
                    databaseFacade.addAddress(addr.addr);
                }
            });

            data.mails.forEach((mail) => {
                var existing = databaseFacade.getMail(mail.id); {
                    if (!existing) {
                        databaseFacade.addMail(mail);
                    }
                }
            });
        }
        else {
            res.sendStatus(400);
            return;
        }
        res.status(200).send();
    });

    return router;
}

export default createRouter;