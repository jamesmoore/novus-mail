import { useState, useEffect } from 'react';

interface Address {
  addr: string;
}

interface AddressesResponse {
  addresses: Address[];
  refreshInterval: number;
}

interface Mail {
  id: string;
  sender: string;
  subject: string;
}

interface MailMessage {
  sender: string;
  subject: string;
  content: string;
}

const handleCopy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

function Mailbox() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [domainName, setDomainName] = useState('...');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [page, setPage] = useState(1);
  const [mails, setMails] = useState<Mail[]>([]);
  const [viewType, setViewType] = useState('mails');
  const [message, setMessage] = useState<MailMessage | null>(null);

  async function copyClicked() {
    await handleCopy(selectedAddress + domainName);
  }

  async function mailClicked(e: React.MouseEvent<HTMLDivElement>, itemKey: string) {
    if (e.type === 'click' && e.button === 0) {
      await getMail(itemKey);
    }
  }

  async function mailKeyUp(e: React.KeyboardEvent<HTMLDivElement>, itemKey: string) {
    if (e.type === 'keyup' && e.key === 'Enter') {
      await getMail(itemKey);
    }
  }

  async function deleteClicked(e: React.MouseEvent<HTMLDivElement>, itemKey: string) {
    e.stopPropagation();
    if (e.type === 'click' && e.button === 0) {
      await deleteMail(itemKey);
    }
  }

  async function deleteKeyUp(e: React.KeyboardEvent<HTMLDivElement>, itemKey: string) {
    e.stopPropagation();
    if (e.type === 'keyup' && e.key === 'Enter') {
      await deleteMail(itemKey);
    }
  }

  async function deleteMail(itemKey: string) {
    console.log("Deleting: " + itemKey);
  }

  async function prevPage() {
    if (page > 1) {
      setPage(page - 1);
    }
  }

  async function nextPage() {
    if (mails.length > 0) {
      setPage(page + 1);
    }
  }

  async function getMail(id: string) {
    fetch('/mailData', {
      method: 'POST',
      body: JSON.stringify(
        {
          id: id,
        }
      ),
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then((message: MailMessage) => {
        setMessage(message);
        setViewType('mailData');
      })
      .catch(error => {
        setError('Failed to fetch message ' + error);
        setLoading(false);
      });
  }

  async function backClicked() {
    setViewType('mails');
    setMessage(null);
  }

  useEffect(() => {
    fetch('/addresses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then((data: AddressesResponse) => {
        setAddresses(data.addresses);
        setLoading(false);
        if (data.addresses.length > 0) {
          setSelectedAddress(data.addresses[data.addresses.length - 1].addr);
        }
      })
      .catch(error => {
        setError('Failed to fetch addresses ' + error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetch('/domain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.text())
      .then((data: string) => {
        setDomainName('@' + data);
        setLoading(false);
      })
      .catch(error => {
        setError('Failed to fetch domain ' + error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setPage(1);
  }, [selectedAddress]);

  useEffect(() => {
    fetch('/mails', {
      method: 'POST',
      body: JSON.stringify(
        {
          addr: selectedAddress,
          page: page
        }
      ),
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then((data: Mail[]) => {
        setMails(data);
        setLoading(false);
      })
      .catch(error => {
        setError('Failed to fetch mails ' + error);
        setLoading(false);
      });
  }, [selectedAddress, page]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <main>
      <div className="adaptWidth flexCenterCol fillHeight gap">

        <div></div>

        <div className="adaptWidthSmall" style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
          <select style={{ flex: 1 }}
            value={selectedAddress}
            onChange={(event) => {
              setSelectedAddress(event.target.value);
            }}
          >
            {addresses.map((address, index) => (
              <option key={index} value={address.addr}>
                {address.addr}
              </option>
            ))}
          </select>
          <span>{domainName}</span>
          <button onKeyUp={copyClicked} onClick={copyClicked} style={{ marginLeft: "10px", paddingTop: "0px", paddingBottom: "0px" }}>Copy</button>
        </div>

        <div id="mailList" className="fillWidth">

          {viewType === 'mails' &&
            <>
              {mails.map((mail) => (
                <>
                  <div key={mail.id} onKeyUp={(e) => mailKeyUp(e, mail.id)} onClick={(e) => mailClicked(e, mail.id)} role="button" tabIndex={1} className="clickable" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }} >
                    <div>
                      <span>{mail.sender}</span>
                      <div></div>
                      <span>{mail.subject}</span>
                    </div>
                    <input onKeyUp={(e) => deleteKeyUp(e, mail.id)} onClick={(e) => deleteClicked(e, mail.id)} type="image" src="trashIcon.svg" alt="X" style={{ width: "2rem", height: "2rem", padding: "1rem" }} />
                  </div>

                  {/* hr size inside flex is 0, gotta wrap with div, not sure why */}
                  <div>
                    <hr />
                  </div>
                </>
              ))
              }
            </>
          }


          {viewType === 'mailData' && message &&
            <>
              <span>{message.sender}</span>
              <div></div>
              <span>{message.subject}</span>

              {/* hr size inside flex is 0, gotta wrap with div, not sure why */}
              <div>
                <hr />
              </div>

              <div id="mailData" style={{ all: "initial", backgroundColor: "white", overflow: "auto", flex: "1" }} dangerouslySetInnerHTML={{ __html: message.content }} />

              <div style={{ height: "10px" }}></div>
              <button onClick={backClicked}>Back</button>

            </>
          }
        </div>

        <div>
          <button className="counter" onClick={prevPage}>❮</button>
          <span>{page}</span>
          <button className="counter" onClick={nextPage}>❯</button>
        </div>

        <button onClick={() => { window.location.replace('/manage.html') }} className="adaptWidthSmall">Manage addresses</button>

        {/* Put a div so that there will be a gap from the flex at the top of the page */}
        <div></div>

      </div >
    </main >
  );
}

export default Mailbox;