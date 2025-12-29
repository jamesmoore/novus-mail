import { AddressesResponse } from "./models/addresses-response";
import { Logout } from "./models/logout";
import { MailMessage } from "./models/mail-message";
import { MailResponse } from "./models/mail-response";
import { UnreadCount } from "./models/unread-count";
import { User } from "./models/user";

const defaultHeaders = {
    'Content-Type': 'application/json',
};

/** To support local development - add this env variable to the file `.env.development.local`, which should be located alongside package.json  */
const BaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
const ApiUrl = `${BaseUrl}/api`;

async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const res = await fetch(input, init);

    if (res.status === 401) {
        window.dispatchEvent(new Event("auth-lost"));
    }

    return res;
}

const fetchDomain = async () => {
    const response = await apiFetch(`${ApiUrl}/domain`, {
        method: 'GET',
        headers: defaultHeaders,
    });
    return response.text();
};

const fetchAddress = async () => {
    const response = await apiFetch(`${ApiUrl}/addresses`, {
        method: 'GET',
        headers: defaultHeaders,
    });
    return response.json() as Promise<AddressesResponse>;
};

const getAddress = async (newAddressText: string) => {
    const response = await apiFetch(`${ApiUrl}/address/${newAddressText}`, {
        method: 'GET',
        headers: defaultHeaders
    });
    if (response.status === 404) {
        return '';
    }
    else if (response.status === 200) {
        return response.text();
    }
}

const addAddress = async (newAddressText: string) => {
    const response = await apiFetch(`${ApiUrl}/address/${newAddressText}`, {
        method: 'PUT',
        headers: defaultHeaders
    });
    return response.status === 200;
}

const deleteAddress = async (selectedAddress: string) => {
    const response = await apiFetch(`${ApiUrl}/address/${selectedAddress}`, {
        method: 'DELETE',
        headers: defaultHeaders
    });
    return response.status === 200;
}

const updateAddress = async (selectedAddress: string, makePrivate: boolean) => {
    const response = await apiFetch(`${ApiUrl}/address/${selectedAddress}`, {
        method: 'POST',
        body: JSON.stringify(
            {
                private: makePrivate,
            }
        ),
        headers: defaultHeaders,
    });
    return response.status === 200;
}

const fetchMails = async (selectedAddress: string, cursorId: string) => {
    const response = await apiFetch(`${ApiUrl}/mails`, {
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

const fetchDeletedMails = async (cursorId: string) => {
    const response = await apiFetch(`${ApiUrl}/mails`, {
        method: 'POST',
        body: JSON.stringify(
            {
                cursorId: cursorId,
                deleted: true
            }
        ),
        headers: defaultHeaders,
    });
    return response.json() as Promise<MailResponse>;
};

const fetchMail = async (id: string) => {
    const response = await apiFetch(`${ApiUrl}/mail/${id}`, {
        method: 'GET',
        headers: defaultHeaders,
    });
    return response.json() as Promise<MailMessage>;
}

const deleteMail = async (id: string) => {
    await apiFetch(`${ApiUrl}/mail/${id}`, {
        method: 'DELETE',
        headers: defaultHeaders,
    })
};

const deleteMails = async (address: string) => {
    await apiFetch(`${ApiUrl}/mails/${address}`, {
        method: 'DELETE',
        headers: defaultHeaders,
    })
};

const emptyDeletedMails = async () => {
    await apiFetch(`${ApiUrl}/emptyDeletedMails`, {
        method: 'POST',
        headers: defaultHeaders,
    })
};

const restoreDeletedMails = async () => {
    await apiFetch(`${ApiUrl}/restoreDeletedMails`, {
        method: 'POST',
        headers: defaultHeaders,
    })
};

const readMail = async (id: string) => {
    await apiFetch(`${ApiUrl}/readMail`, {
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
    await apiFetch(`${ApiUrl}/readAllMail`, {
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
    const response = await apiFetch(`${ApiUrl}/unreadCounts`, {
        method: 'GET',
        headers: defaultHeaders,
    });
    return response.json() as Promise<UnreadCount[]>;
};

const fetchUser = async () => {
    const response = await apiFetch(`${BaseUrl}/auth/user`, {
        method: 'GET',
        headers: defaultHeaders,
    });
    return response.json() as Promise<User>;
};

const logout = async () => {
    const response = await apiFetch(`${BaseUrl}/logout`, {
        method: 'GET',
        headers: defaultHeaders,
    });
    return response.json() as Promise<Logout>;
};

const exportMail = async () => {
    const response = await apiFetch(`${ApiUrl}/export`, {
        method: 'GET',
        headers: defaultHeaders,
    });
    if (!response.ok) {
        throw new Error("Export failed");
    }
    return response;
}

const importMail = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${ApiUrl}/import`, {
        method: "POST",
        body: formData,
        //credentials: "include", // important if you rely on session/OIDC cookies
    });

    if (!res.ok) {
        throw new Error("Import failed");
    }
}


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
    restoreDeletedMails,
    readMail,
    fetchUnreadCounts,
    readAllMail,
    fetchUser,
    logout,
    exportMail,
    importMail,
};