import { Router } from 'express';
import { noCacheMiddleware } from './no-cache-middleware.js';
import { DatabaseFacade } from '../database-facade.js';
import multer from "multer";
import { Address } from '../models/address.js';
import { Mail } from '../models/mail.js';
import AdmZip from 'adm-zip';

interface ExportFile {
    addresses: Address[],
    mails: Mail[],
}

interface ImportStatus {
    addresses: number,
    addressesAdded: number,
    mails: number,
    mailsAdded: number,
}

export function createRouter(databaseFacade: DatabaseFacade) {

    const router = Router();
    router.use(noCacheMiddleware);

    router.get('/export', async (req, res) => {
        const addresses = await databaseFacade.getAddresses(req.user?.sub);
        const mails = await databaseFacade.getAllMails(req.user?.sub);
        const userName = req.user?.name;
        const fileNamePrefix = (userName ? userName + '_' : '') + Date.now();
        const mailsObj: ExportFile = {
            addresses: addresses,
            mails: mails,
        };
        const zip = new AdmZip();
        zip.addFile(fileNamePrefix + '.json', Buffer.from(JSON.stringify(mailsObj, null, 4), "utf8"));
        const zipData = zip.toBuffer();

        res.setHeader('content-disposition', 'attachment; filename=' + fileNamePrefix + '.zip');
        res.setHeader('content-type', 'application/zip');
        res.status(200).end(zipData);
    });

    const upload = multer();

    router.post('/import', upload.single('file'), async (req, res) => {

        const status: ImportStatus = {
            addresses: 0,
            addressesAdded: 0,
            mails: 0,
            mailsAdded: 0,
        };
        if (req.file) {
            const zip = new AdmZip(req.file.buffer);
            const zipEntries = zip.getEntries();

            for (const p of zipEntries) {
                if (p.entryName.endsWith('.json')) {
                    console.log('Importing ' + p.entryName);
                    const data = JSON.parse(p.getData().toString()) as ExportFile;
                    console.log("Received addresses: " + data.addresses.length);
                    console.log("Received mails: " + data.mails.length);

                    for (const addr of data.addresses) {
                        status.addresses++;
                        const existing = await databaseFacade.getAddress(addr.addr);
                        if (!existing) {
                            await databaseFacade.addAddress(addr.addr);
                            status.addressesAdded++;
                        }
                    };

                    for (const mail of data.mails) {
                        status.mails++;
                        const existing = await databaseFacade.getMail(mail.id);
                        if (!existing) {
                            // recreate from deserialized to handle Date conversion.
                            const newMail: Mail = {
                                content: mail.content,
                                deleted: mail.deleted,
                                id: mail.id,
                                read: mail.read,
                                received: new Date(mail.received),
                                recipient: mail.recipient,
                                sender: mail.sender,
                                subject: mail.subject,
                                sendername: mail.sendername,
                            };

                            await databaseFacade.addMail(newMail);
                            status.mailsAdded++;
                        }
                    };
                }
                else {
                    console.error('Ignoring ' + p.entryName);
                }
            }
        }
        else {
            res.sendStatus(400);
            return;
        }
        res.json(status);
    });

    return router;
}

export default createRouter;
