import { Router } from 'express';
import { noCacheMiddleware } from './noCacheMiddleware.js';
import { DatabaseFacade } from '../databaseFacade.js';
import multer from "multer";
import { Address } from '../models/address.js';
import { Mail } from '../models/mail.js';
import AdmZip from 'adm-zip';

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
        const fileNamePrefix = (userName ? userName + '_' : '') + Date.now();
        res.setHeader('content-disposition', 'attachment; filename=' + fileNamePrefix + '.zip');
        const mailsObj: ExportFile = {
            addresses: addresses,
            mails: mails,
        };
        const zip = new AdmZip();
        zip.addFile(fileNamePrefix + '.json', Buffer.from(JSON.stringify(mailsObj, null, 4), "utf8"));
        const zipData = zip.toBuffer();

        res.setHeader('content-type', 'application/zip');
        res.status(200).end(zipData);
    });

    const upload = multer();

    router.post('/import', upload.single('file'), (req, res) => {

        if (req.file) {
            const data = JSON.parse(req.file.buffer.toString()) as ExportFile;
            console.log("Received addresses: " + data.addresses.length);
            console.log("Received mails: " + data.mails.length);

            data.addresses.forEach((addr) => {
                const existing = databaseFacade.getAddress(addr.addr);
                if (!existing) {
                    databaseFacade.addAddress(addr.addr);
                }
            });

            data.mails.forEach((mail) => {
                const existing = databaseFacade.getMail(mail.id); {
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
