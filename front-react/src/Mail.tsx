import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom'
import { fetchMail } from './api-client';
import { useQuery } from '@tanstack/react-query';

function Mail() {
    const navigate = useNavigate();
    const { messageId } = useParams();

    const { data: message, isLoading: loading, error } = useQuery(
        {
            queryKey: ["mail", messageId],
            queryFn: () => messageId ? fetchMail(messageId) : undefined,
        }
    );

    async function backClicked() {
        navigate(-1);
    }

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div className="error">{error.message}</div>;
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