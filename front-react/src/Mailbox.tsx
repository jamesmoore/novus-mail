import { useState, useEffect, useContext } from 'react';
import DialogConf from './DialogConf';
import { isEnterKeyUp, isLeftMouseClick } from './Events';
import { useNavigate } from 'react-router-dom';
import AddressContext from './AddressContext';
import { useQuery } from '@tanstack/react-query';
import { fetchAddress, fetchDomain, fetchMails, deleteMail } from './api-client';

const handleCopy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

function Mailbox() {
  const [error, setError] = useState<string | null>(null);
  const { selectedAddress, setSelectedAddress } = useContext(AddressContext);
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteItemKey, setDeleteItemKey] = useState<string | null>(null);
  const navigate = useNavigate();

  async function copyClicked() {
    await handleCopy(selectedAddress + domainName);
  }

  async function mailClicked(e: React.MouseEvent<HTMLDivElement>, itemKey: string) {
    if (isLeftMouseClick(e)) {
      navigate('/mail/' + itemKey);
    }
  }

  async function mailKeyUp(e: React.KeyboardEvent<HTMLDivElement>, itemKey: string) {
    if (isEnterKeyUp(e)) {
      navigate('/mail' + itemKey);
    }
  }

  async function deleteClicked(e: React.MouseEvent<HTMLDivElement>, itemKey: string) {
    e.stopPropagation();
    if (isLeftMouseClick(e)) {
      await deleteMailEvent(itemKey);
    }
  }

  async function deleteKeyUp(e: React.KeyboardEvent<HTMLDivElement>, itemKey: string) {
    e.stopPropagation();
    if (isEnterKeyUp(e)) {
      await deleteMailEvent(itemKey);
    }
  }

  async function deleteMailEvent(itemKey: string) {
    setDeleteItemKey(itemKey);
    setDeleteConfirm(true);
  }

  async function deleteYes() {
    deleteMail(deleteItemKey!)
      .then(() => {
        setDeleteConfirm(false);
        refreshMails();
      })
      .catch(error => {
        setError('Failed to delete mail ' + error);
      });
  }

  async function deleteNo() {
    setDeleteConfirm(false);
  }

  async function prevPage() {
    if (page > 1) {
      setPage(page - 1);
    }
  }

  async function nextPage() {
    if (mails && mails.length > 0) {
      setPage(page + 1);
    }
  }

  const { data: domainName } = useQuery(
    {
      queryKey: ["domain"],
      queryFn: fetchDomain
    }
  );

  const { data: addressesResponse, isLoading: addressIsLoading } = useQuery(
    {
      queryKey: ["addresses"],
      queryFn: fetchAddress
    }
  )

  useEffect(
    () => {
      if (addressesResponse && addressesResponse.addresses.length > 0) {
        const addresses = addressesResponse.addresses;
        if (selectedAddress === '' || addresses.every(p => p.addr !== selectedAddress)) {
          setSelectedAddress(addresses[addresses.length - 1].addr);
        }
      }
    },
    [addressesResponse]
  );

  useEffect(() => {
    setPage(1);
  }, [selectedAddress]);

  const { data: mails, isLoading: mailsLoading, refetch: refreshMails } = useQuery(
    {
      queryKey: ["mail", selectedAddress, page],
      queryFn: () => fetchMails(selectedAddress, page),
      refetchInterval: addressesResponse ? addressesResponse?.refreshInterval * 1000 : false,
    }
  );

  if (addressIsLoading) {
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
            {addressesResponse && addressesResponse.addresses.map((address, index) => (
              <option key={index} value={address.addr}>
                {address.addr}
              </option>
            ))}
          </select>
          <span>@{domainName}</span>
          <button onKeyUp={copyClicked} onClick={copyClicked} style={{ marginLeft: "10px", paddingTop: "0px", paddingBottom: "0px" }}>Copy</button>
        </div>

        <div id="mailList" className="fillWidth">
          {mailsLoading && (<>Loading...</>)}
          {mails && mails.map((mail) => (
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
        </div>

        <div>
          <button className="counter" onClick={prevPage}>&lt;</button>
          <span>{page}</span>
          <button className="counter" onClick={nextPage}>&gt;</button>
        </div>

        <button onClick={() => { navigate('/manage'); }} className="adaptWidthSmall">Manage addresses</button>

        {/* Put a div so that there will be a gap from the flex at the top of the page */}
        <div></div>

      </div >

      <DialogConf visible={deleteConfirm} text="delete?" onNo={deleteNo} onYes={deleteYes} ></DialogConf>
    </main >
  );
}

export default Mailbox;