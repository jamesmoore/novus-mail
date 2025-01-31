import { AddressesResponse } from "./models/addresses-response";
import { Mail } from "./models/mail";
import { MailMessage } from "./models/mail-message";

const defaultHeaders = {
    'Content-Type': 'application/json',
};

const fetchDomain = async () => {
    const response = await fetch("/domain", {
        method: 'POST',
        headers: defaultHeaders,
    });
    return response.text();
};

const fetchAddress = async () => {
    const response = await fetch('/addresses', {
        method: 'POST',
        headers: defaultHeaders,
    });
    return response.json() as Promise<AddressesResponse>;
};

const addAddress = async (newAddressText: string) => {
    const response = await fetch('/addAddress', {
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
    const response = await fetch('/deleteaddress', {
        method: 'POST',
        body: JSON.stringify({
            address: selectedAddress,
        }),
        headers: defaultHeaders
    });
    return response.text();
}

const fetchMails = async (selectedAddress: string, page: number) => {
    const response = await fetch('/mails', {
        method: 'POST',
        body: JSON.stringify(
            {
                addr: selectedAddress,
                page: page
            }
        ),
        headers: defaultHeaders,
    });
    return response.json() as Promise<Mail[]>;
};

const fetchMail = async (id: string) => {
    const response = await fetch('/mailData', {
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
    await fetch('/deleteMail', {
        method: 'POST',
        body: JSON.stringify(
            {
                id: deleteItemKey,
            }
        ),
        headers: defaultHeaders,
    })
};

export {
    fetchDomain,
    fetchAddress,
    addAddress,
    deleteAddress,
    fetchMails,
    fetchMail,
    deleteMail
};