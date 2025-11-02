import { AddressesResponse } from "./models/addresses-response";
import { MailMessage } from "./models/mail-message";
import { MailResponse } from "./models/mail-response";
import { UnreadCount } from "./models/unread-count";
import { User } from "./models/user";

const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
};

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

let csrfTokenPromise: Promise<string> | null = null;

const getCsrfToken = async (): Promise<string> => {
    if (!csrfTokenPromise) {
        csrfTokenPromise = fetch(`${BaseUrl}/auth/csrf-token`, {
            method: 'GET',
            headers: defaultHeaders,
        })
            .then(async (response) => {
                const payload = await response.json() as { csrfToken?: string };
                if (!payload.csrfToken) {
                    throw new Error('Missing CSRF token in response');
                }

                return payload.csrfToken;
            })
            .catch((error) => {
                csrfTokenPromise = null;
                throw error;
            });
    }

    return csrfTokenPromise;
};

const csrfFetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const method = init.method?.toUpperCase() ?? 'GET';
    const headers = new Headers(defaultHeaders);

    if (init.headers) {
        const existingHeaders = new Headers(init.headers);
        existingHeaders.forEach((value, key) => headers.set(key, value));
    }

    if (!SAFE_METHODS.has(method)) {
        const csrfToken = await getCsrfToken();
        headers.set('X-CSRF-Token', csrfToken);
    }

    return fetch(input, { ...init, headers });
};

/** To support local development - add this env variable to the file `.env.development.local`, which should be located alongside package.json  */
const BaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
const ApiUrl = `${BaseUrl}/api`;

const fetchDomain = async () => {
    const response = await csrfFetch(`${ApiUrl}/domain`, {
        method: 'GET',
    });
    return response.text();
};

const fetchAddress = async () => {
    const response = await csrfFetch(`${ApiUrl}/addresses`, {
        method: 'GET',
    });
    return response.json() as Promise<AddressesResponse>;
};

const getAddress = async (newAddressText: string) => {
    const response = await csrfFetch(`${ApiUrl}/address/${newAddressText}`, {
        method: 'GET'
    });
    if (response.status === 404) {
        return '';
    }
    else if (response.status === 200) {
        return response.text();
    }
}

const addAddress = async (newAddressText: string) => {
    const response = await csrfFetch(`${ApiUrl}/address/${newAddressText}`, {
        method: 'PUT'
    });
    return response.status === 200;
}

const deleteAddress = async (selectedAddress: string) => {
    const response = await csrfFetch(`${ApiUrl}/address/${selectedAddress}`, {
        method: 'DELETE'
    });
    return response.status === 200;
}

const updateAddress = async (selectedAddress: string, makePrivate: boolean) => {
    const response = await csrfFetch(`${ApiUrl}/address/${selectedAddress}`, {
        method: 'POST',
        body: JSON.stringify(
            {
                private: makePrivate,
            }
        )
    });
    return response.status === 200;
}

const fetchMails = async (selectedAddress: string, cursorId: string) => {
    const response = await csrfFetch(`${ApiUrl}/mails`, {
        method: 'POST',
        body: JSON.stringify(
            {
                addr: selectedAddress,
                cursorId: cursorId
            }
        )
    });
    return response.json() as Promise<MailResponse>;
};

const fetchDeletedMails = async (cursorId: string) => {
    const response = await csrfFetch(`${ApiUrl}/mails`, {
        method: 'POST',
        body: JSON.stringify(
            {
                cursorId: cursorId,
                deleted: true
            }
        )
    });
    return response.json() as Promise<MailResponse>;
};

const fetchMail = async (id: string) => {
    const response = await csrfFetch(`${ApiUrl}/mail/${id}`, {
        method: 'GET',
    });
    return response.json() as Promise<MailMessage>;
}

const deleteMail = async (id: string) => {
    await csrfFetch(`${ApiUrl}/mail/${id}`, {
        method: 'DELETE',
    })
};

const deleteMails = async (address: string) => {
    await csrfFetch(`${ApiUrl}/mails/${address}`, {
        method: 'DELETE',
    })
};

const emptyDeletedMails = async () => {
    await csrfFetch(`${ApiUrl}/emptyDeletedMails`, {
        method: 'POST',
    })
};

const readMail = async (id: string) => {
    await csrfFetch(`${ApiUrl}/readMail`, {
        method: 'POST',
        body: JSON.stringify(
            {
                id: id,
            }
        )
    })
};

const readAllMail = async (address: string) => {
    await csrfFetch(`${ApiUrl}/readAllMail`, {
        method: 'POST',
        body: JSON.stringify(
            {
                address: address,
            }
        )
    })
};

const fetchUnreadCounts = async () => {
    const response = await csrfFetch(`${ApiUrl}/unreadCounts`, {
        method: 'GET',
    });
    return response.json() as Promise<UnreadCount[]>;
};

const fetchUser = async () => {
    const response = await csrfFetch(`${BaseUrl}/auth/user`, {
        method: 'GET',
    });
    return response.json() as Promise<User>;
};

export {
    fetchDomain,
    fetchAddress,
    getAddress,
    addAddress,
    deleteAddress,
    updateAddress,
    fetchMails,
    fetchDeletedMails,
    fetchMail,
    deleteMail,
    deleteMails,
    emptyDeletedMails,
    readMail,
    fetchUnreadCounts,
    readAllMail,
    fetchUser,
};