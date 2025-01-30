import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom'

interface MailMessage {
    sender: string;
    subject: string;
    content: string;
}

function Mail() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<MailMessage | null>(null);
    const navigate = useNavigate();
    const { messageId } = useParams();

    useEffect(() => {
        if (messageId) {
            getMail(messageId);
        }
    }, [messageId])

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
                setLoading(false);
            })
            .catch(error => {
                setError('Failed to fetch message ' + error);
            });
    }

    async function backClicked() {
        navigate(-1);
    }

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

                <div id="mailList" className="fillWidth">
                    {message &&
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

                        </>}
                </div>

                <button onClick={() => { navigate('/manage'); }} className="adaptWidthSmall">Manage addresses</button>

                {/* Put a div so that there will be a gap from the flex at the top of the page */}
                <div></div>

            </div >

            {/* <DialogConf visible={deleteConfirm} text="delete?" onNo={deleteNo} onYes={deleteYes} ></DialogConf> */}
        </main >
    );
}

export default Mail;