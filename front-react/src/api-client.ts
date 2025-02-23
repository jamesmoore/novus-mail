import { AddressesResponse } from "./models/addresses-response";
import { MailMessage } from "./models/mail-message";
import { MailResponse } from "./models/mail-response";
import { UnreadCount } from "./models/unread-count";

const defaultHeaders = {
    'Content-Type': 'application/json',
};

/** To support local development - add this env variable to the file `.env.development.local`, which should be located alongside package.json  */
const BaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

const fetchDomain = async () => {
    const response = await fetch(`${BaseUrl}/domain`, {
        method: 'POST',
        headers: defaultHeaders,
    });
    return response.text();
};

const fetchAddress = async () => {
    const response = await fetch(`${BaseUrl}/addresses`, {
        method: 'POST',
        headers: defaultHeaders,
    });
    return response.json() as Promise<AddressesResponse>;
};

const addAddress = async (newAddressText: string) => {
    const response = await fetch(`${BaseUrl}/addAddress`, {
        method: 'POST',
        body: JSON.stringify(
            {
                address: newAddressText,
            }
        ),
        headers: defaultHeaders
    });
    return response.text();
}

const deleteAddress = async (selectedAddress: string) => {
    const response = await fetch(`${BaseUrl}/deleteaddress`, {
        method: 'POST',
        body: JSON.stringify({
            address: selectedAddress,
        }),
        headers: defaultHeaders
    });
    return response.text();
}

const fetchMails = async (selectedAddress: string, cursorId: string) => {
    const response = await fetch(`${BaseUrl}/mails`, {
        method: 'POST',
        body: JSON.stringify(
            {
                addr: selectedAddress,
                cursorId: cursorId
            }
        ),
        headers: defaultHeaders,
    });
    return response.json() as Promise<MailResponse>;
};

const fetchMail = async (id: string) => {
    const response = await fetch(`${BaseUrl}/mailData`, {
        method: 'POST',
        body: JSON.stringify(
            {
                id: id,
            }
        ),
        headers: defaultHeaders,
    });
    return response.json() as Promise<MailMessage>;
}

const deleteMail = async (deleteItemKey: string) => {
    await fetch(`${BaseUrl}/deleteMail`, {
        method: 'POST',
        body: JSON.stringify(
            {
                id: deleteItemKey,
            }
        ),
        headers: defaultHeaders,
    })
};

const readMail = async (id: string) => {
    await fetch(`${BaseUrl}/readMail`, {
        method: 'POST',
        body: JSON.stringify(
            {
                id: id,
            }
        ),
        headers: defaultHeaders,
    })
};

const readAllMail = async (address: string) => {
    await fetch(`${BaseUrl}/readAllMail`, {
        method: 'POST',
        body: JSON.stringify(
            {
                address: address,
            }
        ),
        headers: defaultHeaders,
    })
};

const fetchUnreadCounts = async () => {
    const response = await fetch(`${BaseUrl}/unreadCounts`, {
        method: 'POST',
        headers: defaultHeaders,
    });
    return response.json() as Promise<UnreadCount[]>;
};

export {
    fetchDomain,
    fetchAddress,
    addAddress,
    deleteAddress,
    fetchMails,
    fetchMail,
    deleteMail,
    readMail,
    fetchUnreadCounts,
    readAllMail,
};