import { MailResponseDto } from "./dto/mail-response-dto";
import { Mail } from "./models/mail";
import { AddressesResponse } from "./models/addresses-response";
import { ImportStatus } from "./models/import-status";
import { Logout } from "./models/logout";
import { MailMessage } from "./models/mail-message";
import { UnreadCount } from "./models/unread-count";
import { User } from "./models/user";
import { MailDto } from "./dto/mail-dto";
import { MailMessageDto } from "./dto/mail-message-dto";
import { ApiKey, CreatedApiKey } from "./models/api-key";

const defaultHeaders = {
    'Content-Type': 'application/json',
};

/** To support local development - add this env variable to the file `.env.development.local`, which should be located alongside package.json  */
const BaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
const ApiUrl = `${BaseUrl}/api`;

class ApiError extends Error {
    constructor(
        message: string,
        readonly status: number,
        readonly response: Response,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

async function getErrorMessage(response: Response) {
    const fallback = `${response.status} ${response.statusText || 'Request failed'}`;
    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
        const body = await response.clone().json().catch(() => undefined) as
            { error?: string; message?: string; title?: string } | undefined;
        return body?.error ?? body?.message ?? body?.title ?? fallback;
    }

    const body = await response.clone().text().catch(() => '');
    return body.trim() || fallback;
}

async function apiFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
    allowedErrorStatuses: readonly number[] = [],
): Promise<Response> {
    const response = await fetch(input, init);

    if (response.status === 401) {
        window.dispatchEvent(new Event('auth-lost'));
    }

    if (!response.ok && !allowedErrorStatuses.includes(response.status)) {
        throw new ApiError(await getErrorMessage(response), response.status, response);
    }

    return response;
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
    }, [404]);
    if (response.status === 404) {
        return '';
    }
    return response.text();
}

const addAddress = async (newAddressText: string) => {
    await apiFetch(`${ApiUrl}/address/${newAddressText}`, {
        method: 'PUT',
        headers: defaultHeaders
    });
}

const deleteAddress = async (selectedAddress: string) => {
    await apiFetch(`${ApiUrl}/address/${selectedAddress}`, {
        method: 'DELETE',
        headers: defaultHeaders
    });
}

const updateAddress = async (selectedAddress: string, makePrivate: boolean) => {
    await apiFetch(`${ApiUrl}/address/${selectedAddress}`, {
        method: 'POST',
        body: JSON.stringify(
            {
                private: makePrivate,
            }
        ),
        headers: defaultHeaders,
    });
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
    const responseDto = await response.json() as MailResponseDto;
    return mapMailResponseDtoToMailResponse(responseDto);
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
    const responseDto = await response.json() as MailResponseDto;
    return mapMailResponseDtoToMailResponse(responseDto);
};

const fetchMail = async (id: string) => {
    const response = await apiFetch(`${ApiUrl}/mail/${id}`, {
        method: 'GET',
        headers: defaultHeaders,
    });
    const mailMessageDto = await response.json() as MailMessageDto;
    return mapMailMessageDtoToMailMessage(mailMessageDto);
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
    return response;
}

const importMail = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiFetch(`${ApiUrl}/import`, {
        method: 'POST',
        body: formData,
        //credentials: 'include', // important if you rely on session/OIDC cookies
    });

    return response.json() as Promise<ImportStatus>;
}

const fetchApiKeys = async () => {
    const response = await apiFetch(`${ApiUrl}/api-keys`, {
        method: 'GET',
        headers: defaultHeaders,
    });
    return response.json() as Promise<ApiKey[]>;
};

const createApiKey = async (name: string, expiresAt: string | null) => {
    const response = await apiFetch(`${ApiUrl}/api-keys`, {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify({ name, expiresAt }),
    });
    return response.json() as Promise<CreatedApiKey>;
};

const revokeApiKey = async (id: string) => {
    await apiFetch(`${ApiUrl}/api-keys/${id}`, {
        method: 'DELETE',
        headers: defaultHeaders,
    });
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
    restoreDeletedMails,
    readMail,
    fetchUnreadCounts,
    readAllMail,
    fetchUser,
    logout,
    exportMail,
    importMail,
    fetchApiKeys,
    createApiKey,
    revokeApiKey,
    ApiError,
};

function mapMailResponseDtoToMailResponse(responseDto: MailResponseDto) {
    return {
        nextId: responseDto.nextId,
        previousId: responseDto.previousId,
        mails: responseDto.mails.map(mapMailDtoToMail),
    };
}

function mapMailDtoToMail(p: MailDto): Mail {
    return {
        id: p.id,
        read: p.read,
        received: new Date(p.received),
        sender: p.sender,
        sendername: p.sendername,
        subject: p.subject,
    };
}

function mapMailMessageDtoToMailMessage(mailMessageDto: MailMessageDto): MailMessage {
    return {
        content: mailMessageDto.content,
        read: mailMessageDto.read,
        received: new Date(mailMessageDto.received),
        recipient: mailMessageDto.recipient,
        sender: mailMessageDto.sender,
        sendername: mailMessageDto.sendername,
        subject: mailMessageDto.subject,
    };
}
